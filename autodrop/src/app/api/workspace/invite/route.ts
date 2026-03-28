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

    if (targetUser) {
      // 3a. Add existing user to workspace_members
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
      return NextResponse.json({ message: 'User added to workspace successfully' }, { status: 200 })
    } else {
    // 3b. User doesn't exist yet, create a pending invitation
    const { data: workspace, error: wsFetchError } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single()

    if (wsFetchError) throw wsFetchError

    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        workspace_id: workspaceId,
        email: email,
        role: role,
        invited_by: requesterId,
      })

    if (inviteError) {
      if (inviteError.code === '23505') {
        return NextResponse.json({ error: 'An invitation is already pending for this email in this workspace' }, { status: 400 })
      }
      throw inviteError
    }

    // 4. Send the invitation email via Resend
    try {
      const { resend } = await import('@/lib/resend')
      const origin = req.headers.get('origin') || 'https://auto-drop-v1.vercel.app'
      const inviteUrl = `${origin}/signup?invite=${workspaceId}`

      await resend.emails.send({
        from: 'AutoDrop <onboarding@resend.dev>', // You should verify your domain in Resend for custom sender
        to: email,
        subject: `You've been invited to join ${workspace.name} on AutoDrop`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">Welcome to AutoDrop!</h1>
            <p>You've been invited to join the <strong>${workspace.name}</strong> workspace as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept your invitation and get started:</p>
            <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Accept Invitation</a>
            <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link: <br/> ${inviteUrl}</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send email but invitation was created:', emailErr)
      // We don't fail the whole request if email fails, but we log it
    }

    return NextResponse.json({ message: 'Invitation sent successfully' }, { status: 200 })
    }
  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
