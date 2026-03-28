import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: requesterId } = await auth()

  if (!requesterId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: workspaceId } = await params

  try {

    // 1. Check if requester is a member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', requesterId)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Fetch all members with user details
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select(`
        id,
        role,
        user:users (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)

    if (membersError) throw membersError

    // 3. Fetch pending invitations
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('id, email, role')
      .eq('workspace_id', workspaceId)

    if (invError) console.error('Error fetching invitations:', invError)

    // Format the response to include both members and invites
    const combined = [
      ...(members || []).map((m: any) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar_url,
        role: m.role,
        status: 'active'
      })),
      ...(invitations || []).map((i: any) => ({
        id: i.id, // Using invitation ID as fallback
        name: i.email.split('@')[0], // Placeholder name
        email: i.email,
        avatar: null,
        role: i.role,
        status: 'pending'
      }))
    ]

    return NextResponse.json(combined, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
