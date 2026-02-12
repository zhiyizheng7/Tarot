import { NextRequest, NextResponse } from "next/server";
import { DrawnCard, getCardWithData } from "@/lib/tarot";
import { Aspect, buildReadingPrompt } from "@/lib/prompts";
import { getInterpretation } from "@/lib/gemini";

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

    const cardsWithData = cards.map((c) => getCardWithData(c, aspect));
    const prompt = buildReadingPrompt(cardsWithData, question, aspect);
    const interpretation = await getInterpretation(prompt);

    return NextResponse.json({ interpretation });
  } catch (error) {
    console.error("Reading API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
