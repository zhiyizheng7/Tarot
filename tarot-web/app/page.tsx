"use client";

import { useState, useCallback, useMemo } from "react";
import { drawCards } from "@/lib/tarot";
import { Aspect } from "@/lib/prompts";
import { validateQuestion } from "@/lib/validation";
import QuestionForm from "@/components/QuestionForm";
import CardSpread from "@/components/CardSpread";
import ReadingResult from "@/components/ReadingResult";
import majorArcana from "@/data/major_arcana.json";

type Phase = "IDLE" | "THINKING" | "SHUFFLING" | "COMPLETED";

interface DrawnCardWithName {
  cardId: number;
  name: string;
  position: "過去" | "現在" | "未來";
  orientation: "upright" | "reversed";
}

function generateStars(count: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const x = ((i * 137.508) % 100).toFixed(1);
    const y = ((i * 73.137) % 100).toFixed(1);
    const duration = (2 + (i % 5)).toFixed(1);
    const delay = ((i * 0.7) % 4).toFixed(1);
    const opacity = (0.2 + (i % 6) * 0.1).toFixed(1);
    stars.push({ x, y, duration, delay, opacity });
  }
  return stars;
}

const PHASE_LABEL: Record<Phase, string> = {
  IDLE: "待命",
  THINKING: "提問中",
  SHUFFLING: "洗牌解讀中",
  COMPLETED: "已完成",
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [question, setQuestion] = useState("");
  const [aspect, setAspect] = useState<Aspect>("love");
  const [drawnCards, setDrawnCards] = useState<DrawnCardWithName[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stars = useMemo(() => generateStars(48), []);

  function handleSubmit(q: string, a: Aspect) {
    const validation = validateQuestion(q);
    if (!validation.valid) {
      setReading(validation.message ?? "問題格式不正確");
      setPhase("COMPLETED");
      return;
    }

    setQuestion(q);
    setAspect(a);
    setPhase("THINKING");

    const cards = drawCards();
    const cardsWithNames: DrawnCardWithName[] = cards.map((c) => {
      const cardData = majorArcana.major_arcana.find((m) => m.id === c.cardId)!;
      return { ...c, name: cardData.name };
    });

    setDrawnCards(cardsWithNames);
    setPhase("SHUFFLING");
  }

  const handleAllFlipped = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          aspect,
          cards: drawnCards.map(({ cardId, position, orientation }) => ({
            cardId,
            position,
            orientation,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "連結星際能量失敗，請重新翻牌。");
      setReading(data.interpretation);
    } catch (err) {
      console.error(err);
      setReading("連結星際能量失敗，請重新翻牌。");
    } finally {
      setIsLoading(false);
      setPhase("COMPLETED");
    }
  }, [question, aspect, drawnCards]);

  function handleReset() {
    setPhase("IDLE");
    setQuestion("");
    setAspect("love");
    setDrawnCards([]);
    setReading(null);
    setIsLoading(false);
  }

  return (
    <div className="app-shell relative min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-8">
      <div className="star-field">
        {stars.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              "--duration": `${s.duration}s`,
              "--delay": `${s.delay}s`,
              "--max-opacity": s.opacity,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="orb orb-left" />
      <div className="orb orb-right" />

      <div className="relative z-10 flex flex-col items-center w-full gap-6">
        <div className="phase-tag">狀態：{PHASE_LABEL[phase]}</div>

        {(phase === "IDLE" || phase === "THINKING") && <QuestionForm onSubmit={handleSubmit} />}

        {phase === "SHUFFLING" && <CardSpread cards={drawnCards} onAllFlipped={handleAllFlipped} />}

        {phase === "COMPLETED" && (
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="flex flex-wrap justify-center gap-4">
              {drawnCards.map((card) => (
                <div key={`${card.position}-${card.cardId}`} className="mini-card text-center px-4 py-2 rounded-lg">
                  <div className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                    {card.position}
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--accent-main)" }}>
                    {card.name}
                  </div>
                  <div className="text-xs" style={{ color: card.orientation === "upright" ? "#8de3bd" : "#ff9f7f" }}>
                    {card.orientation === "upright" ? "正位" : "逆位"}
                  </div>
                </div>
              ))}
            </div>

            <ReadingResult reading={reading} isLoading={isLoading} onReset={handleReset} />
          </div>
        )}
      </div>
    </div>
  );
}
