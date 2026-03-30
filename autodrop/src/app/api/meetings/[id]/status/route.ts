import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: meetingId } = await params;
    if (!meetingId) {
      return NextResponse.json({ error: "Missing meeting id" }, { status: 400 });
    }

    const { data: meeting, error } = await supabaseAdmin
      .from("meetings")
      .select("status, duration")
      .eq("id", meetingId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: meetingId } = await params;
    const body = await req.json();
    const status = String(body.status || "").trim();
    const duration = body.duration ? String(body.duration).trim() : undefined;

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meeting id" }, { status: 400 });
    }

    if (!status || !["processing", "live", "completed", "failed"].includes(status)) {
      return NextResponse.json({ error: "Invalid meeting status" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { status };
    if (duration !== undefined) {
      updatePayload.duration = duration;
    }

    const { data: meeting, error } = await supabaseAdmin
      .from("meetings")
      .update(updatePayload)
      .eq("id", meetingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
