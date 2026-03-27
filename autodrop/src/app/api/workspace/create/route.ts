import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await req.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })
    }

    // 0. Ensure the user exists in Supabase (in case the Clerk webhook hasn't fired yet)
    const clerkUser = await currentUser()
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
      const fullName = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'Anonymous'
      await supabaseAdmin.from('users').upsert(
        {
          id: userId,
          email,
          name: fullName,
          avatar_url: clerkUser.imageUrl,
        },
        { onConflict: 'id' }
      )
    }

    // 1. Create the workspace
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name,
        created_by: userId,
      })
      .select()
      .single()

    if (wsError) throw wsError

    // 2. Add the creator as an admin member
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'admin',
      })

    if (memberError) {
      console.error('Error adding creator as member:', memberError)
      // Rollback workspace creation
      await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id)
      throw memberError
    }

    return NextResponse.json(workspace, { status: 201 })
  } catch (error: any) {
    console.error('Workspace creation error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
