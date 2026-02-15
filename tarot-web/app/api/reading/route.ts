import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { DrawnCard, getCardWithData } from "@/lib/tarot";
import { Aspect, buildReadingPrompt } from "@/lib/prompts";
import { getInterpretation } from "@/lib/gemini";
import { isSupportedAspect, validateQuestion } from "@/lib/validation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface ReadingRequest {
  question: string;
  aspect: Aspect;
  cards: DrawnCard[];
  threadId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "請先登入後再開始占卜。" }, { status: 401 });
    }

    const body: ReadingRequest = await request.json();
    const { question, aspect, cards, threadId } = body;

    if (!question || !aspect || !cards || cards.length !== 3) {
      return NextResponse.json(
        { error: "Missing or invalid fields: question, aspect, cards (3)" },
        { status: 400 }
      );
    }

    if (!isSupportedAspect(aspect)) {
      return NextResponse.json({ error: "不支援的占卜分類。" }, { status: 400 });
    }

    const questionValidation = validateQuestion(question);
    if (!questionValidation.valid) {
      return NextResponse.json(
        { error: questionValidation.message ?? "問題格式不正確。" },
        { status: 400 }
      );
    }

    const cardsWithData = cards.map((c) => getCardWithData(c));
    const prompt = buildReadingPrompt(cardsWithData, question, aspect);
    const interpretation = await getInterpretation(prompt);

    let resolvedThreadId = threadId;

    if (resolvedThreadId) {
      const thread = await prisma.readingThread.findFirst({
        where: {
          id: resolvedThreadId,
          userEmail,
        },
        select: { id: true },
      });

      if (!thread) {
        resolvedThreadId = undefined;
      }
    }

    if (!resolvedThreadId) {
      const insertedThread = await prisma.readingThread.create({
        data: {
          userEmail,
          title: question.slice(0, 32),
        },
        select: { id: true },
      });

      resolvedThreadId = insertedThread.id;
    }

    await prisma.readingMessage.create({
      data: {
        threadId: resolvedThreadId,
        role: "user",
        content: question,
        aspect,
        cards: cards as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.readingMessage.create({
      data: {
        threadId: resolvedThreadId,
        role: "assistant",
        content: interpretation,
      },
    });

    await prisma.readingThread.update({
      where: { id: resolvedThreadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ interpretation, threadId: resolvedThreadId });
  } catch (error) {
    console.error("Reading API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message.includes("timeout") ||
      message.includes("Gemini API error") ||
      message.includes("PERMISSION_DENIED")
    ) {
      return NextResponse.json(
        { error: "連結星際能量失敗，請重新翻牌。" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
