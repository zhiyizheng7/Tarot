import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/db";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: threadId } = await context.params;

  const supabase = getSupabaseClient();
  const { data: thread, error: threadError } = await supabase
    .from("reading_threads")
    .select("id, title, created_at, updated_at")
    .eq("id", threadId)
    .eq("user_id", userEmail)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const { data: messages, error: messageError } = await supabase
    .from("reading_messages")
    .select("id, role, content, aspect, cards, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  return NextResponse.json({ thread, messages: messages ?? [] });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: threadId } = await context.params;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("reading_threads")
    .delete()
    .eq("id", threadId)
    .eq("user_id", userEmail);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
