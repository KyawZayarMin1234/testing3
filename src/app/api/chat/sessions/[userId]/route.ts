import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const userId = params.userId;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Invalid or missing User ID" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json([]); // return empty array on error
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json([]); // return empty array on unexpected error
  }
}
