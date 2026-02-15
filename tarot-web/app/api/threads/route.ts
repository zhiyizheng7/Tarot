import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await prisma.readingThread.findMany({
    where: { userEmail },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    threads: threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      created_at: thread.createdAt.toISOString(),
      updated_at: thread.updatedAt.toISOString(),
    })),
  });
}
