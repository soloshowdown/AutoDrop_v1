import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId: requesterId } = await auth()

  if (!requesterId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { workspaceId, email, role = 'member' } = await req.json()

    if (!workspaceId || !email) {
      return NextResponse.json({ error: 'Workspace ID and Email are required' }, { status: 400 })
    }

    // 1. Check if requester is an admin of the workspace
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', requesterId)
      .single()

    if (memberError || member?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 })
    }

    // 2. Find the user by email
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found in AutoDrop. They must sign in first.' }, { status: 404 })
    }

    // 3. Add user to workspace_members
    const { error: inviteError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: targetUser.id,
        role: role,
      })

    if (inviteError) {
      if (inviteError.code === '23505') {
        return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 })
      }
      throw inviteError
    }

    return NextResponse.json({ message: 'User invited successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
