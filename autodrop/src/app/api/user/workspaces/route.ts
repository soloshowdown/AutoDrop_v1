import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {

    const { data: workspaces, error } = await supabase
      .from('workspace_members')
      .select(`
        role,
        workspace:workspaces (
          id,
          name,
          created_by,
          created_at
        )
      `)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json(workspaces, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching user workspaces:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
