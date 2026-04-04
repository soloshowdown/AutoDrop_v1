import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ name })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user profile:", error);
      return new NextResponse("Failed to update user profile", { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
