import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workspaceId = String(body.workspaceId || "").trim();
    const roomId = String(body.roomId || "").trim();
    const title = String(body.title || "").trim() || `Live meeting ${roomId}`;

    if (!workspaceId || !roomId) {
      return NextResponse.json({ error: "workspaceId and roomId are required" }, { status: 400 });
    }

    const { data: existingMeeting, error: fetchError } = await supabaseAdmin
      .from("meetings")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existingMeeting) {
      const { data: updatedMeeting, error: updateError } = await supabaseAdmin
        .from("meetings")
        .update({ status: "live", title: existingMeeting.title || title, workspace_id: workspaceId })
        .eq("id", existingMeeting.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json(updatedMeeting);
    }

    const { data: meeting, error: insertError } = await supabaseAdmin
      .from("meetings")
      .insert({
        workspace_id: workspaceId,
        title,
        room_id: roomId,
        status: "live",
        duration: "Live",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
