import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const meetingId = formData.get("meetingId") as string;
    const chunkIndex = formData.get("chunkIndex") as string;
    const audioBlob = formData.get("audio") as Blob;

    if (!meetingId || !chunkIndex || !audioBlob) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const storagePath = `chunks/${meetingId}/${chunkIndex}.webm`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("meetings")
      .upload(storagePath, buffer, {
        contentType: "audio/webm",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, path: storagePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

