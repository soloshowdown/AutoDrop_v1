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

    const targetEmail = email.trim().toLowerCase()

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

    // 2. Fetch workspace details for the email
    const { data: workspace, error: wsFetchError } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single()

    if (wsFetchError) throw wsFetchError

    // 3. Check if user is already a direct member of the workspace
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .ilike('email', targetEmail) // Case-insensitive match for the users table
      .maybeSingle()

    let isActiveMember = false
    if (targetUser) {
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetUser.id)
        .maybeSingle()

      if (existingMember) {
        isActiveMember = true
        return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 })
      }
    }

    // 4. Check for existing invitation record
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('invites')
      .select('id, status, role')
      .eq('workspace_id', workspaceId)
      .eq('email', targetEmail)
      .maybeSingle()

    if (existingInviteError) throw existingInviteError

    if (existingInvite) {
      // If the invitation was 'accepted' but they AREN'T an active member (checked above), 
      // we allow resetting it to pending so they can try joining again.
      if (existingInvite.status === 'accepted' && !isActiveMember) {
        const { error: resetError } = await supabase
          .from('invites')
          .update({ 
            status: 'pending', 
            role: role, 
            invited_by: requesterId 
          })
          .eq('id', existingInvite.id)
        
        if (resetError) throw resetError
      } else if (existingInvite.status === 'accepted' && isActiveMember) {
        return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 })
      } else if (existingInvite.status === 'rejected' || existingInvite.role !== role) {
        // Reset rejected invite or update role
        const { error: updateError } = await supabase
          .from('invites')
          .update({ 
            status: 'pending', 
            role: role, 
            invited_by: requesterId 
          })
          .eq('id', existingInvite.id)
        
        if (updateError) throw updateError
      }
      // If it's already pending with same role, we just proceed to re-send the email
    } else {
      // 5. Create a new entry in the 'invites' table
      const { error: inviteError } = await supabase
        .from('invites')
        .insert({
          workspace_id: workspaceId,
          email: targetEmail,
          role: role,
          invited_by: requesterId,
          status: 'pending'
        })

      if (inviteError) throw inviteError
    }

    // 3. Send the invitation email via Resend (Best Effort)
    let emailStatus = 'sent'
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping invitation email.');
        emailStatus = 'missing-key'
      } else {
        const { resend } = await import('@/lib/resend')
        const origin = req.headers.get('origin') || 'https://auto-drop-v1.vercel.app'
        const inviteUrl = `${origin}/invites`

        await resend.emails.send({
          from: 'AutoDrop <onboarding@resend.dev>',
          to: targetEmail,
          subject: `You've been invited to join ${workspace.name} on AutoDrop`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
              <h1 style="color: #3b82f6; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Welcome to AutoDrop!</h1>
              <p style="color: #374151; font-size: 16px; line-height: 24px;">You've been invited to join the <strong>${workspace.name}</strong> workspace as a <strong>${role}</strong>.</p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Click the button below to view your invitation inbox and accept or decline:</p>
              <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);">View Invitation Inbox</a>
              <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link: <br/> <span style="color: #3b82f6;">${inviteUrl}</span></p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">&copy; 2026 AutoDrop. Streamlining your meetings into intelligence.</p>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      console.error('Failed to send email but invitation was created:', emailErr)
      emailStatus = 'failed'
    }

    return NextResponse.json({ 
      message: emailStatus === 'sent' 
        ? 'Invite sent and stored successfully.' 
        : 'Invite stored successfully. Manual link suggested since email failed/skipped.',
      emailStatus,
      inviteUrl: `${req.headers.get('origin') || 'https://auto-drop-v1.vercel.app'}/invites`
    }, { status: 200 })
  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
