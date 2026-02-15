import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const thread = await prisma.readingThread.findFirst({
    where: {
      id: threadId,
      userEmail,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const messages = await prisma.readingMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      aspect: true,
      cards: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    thread: {
      id: thread.id,
      title: thread.title,
      created_at: thread.createdAt.toISOString(),
      updated_at: thread.updatedAt.toISOString(),
    },
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      aspect: message.aspect,
      cards: message.cards,
      created_at: message.createdAt.toISOString(),
    })),
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: threadId } = await context.params;

  await prisma.readingThread.deleteMany({
    where: {
      id: threadId,
      userEmail,
    },
  });

  return NextResponse.json({ success: true });
}
