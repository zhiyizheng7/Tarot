import { NextRequest, NextResponse } from "next/server";
import { DrawnCard, getCardWithData } from "@/lib/tarot";
import { Aspect, buildReadingPrompt } from "@/lib/prompts";
import { getInterpretation } from "@/lib/gemini";
import { isSupportedAspect, validateQuestion } from "@/lib/validation";

interface ReadingRequest {
  question: string;
  aspect: Aspect;
  cards: DrawnCard[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ReadingRequest = await request.json();
    const { question, aspect, cards } = body;

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

    return NextResponse.json({ interpretation });
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
