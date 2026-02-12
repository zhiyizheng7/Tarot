"use client";

import { useState, useCallback, useMemo } from "react";
import { drawCards } from "@/lib/tarot";
import { Aspect } from "@/lib/prompts";
import QuestionForm from "@/components/QuestionForm";
import CardSpread from "@/components/CardSpread";
import ReadingResult from "@/components/ReadingResult";
import majorArcana from "@/data/major_arcana.json";

type Phase = "input" | "cards" | "reading";

interface DrawnCardWithName {
  cardId: number;
  name: string;
  position: "過去" | "現在" | "未來";
  orientation: "upright" | "reversed";
}

// Generate deterministic star positions so they don't shift on re-render
function generateStars(count: number) {
  const stars = [];
  // Use a simple seeded approach with fixed values
  for (let i = 0; i < count; i++) {
    const x = ((i * 137.508) % 100).toFixed(1);
    const y = ((i * 73.137) % 100).toFixed(1);
    const duration = (2 + (i % 5)).toFixed(1);
    const delay = ((i * 0.7) % 4).toFixed(1);
    const opacity = (0.3 + (i % 6) * 0.1).toFixed(1);
    stars.push({ x, y, duration, delay, opacity });
  }
  return stars;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [question, setQuestion] = useState("");
  const [aspect, setAspect] = useState<Aspect>("core");
  const [drawnCards, setDrawnCards] = useState<DrawnCardWithName[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stars = useMemo(() => generateStars(50), []);

  function handleSubmit(q: string, a: Aspect) {
    setQuestion(q);
    setAspect(a);

    // Draw cards on client side
    const cards = drawCards();
    const cardsWithNames: DrawnCardWithName[] = cards.map((c) => {
      const cardData = majorArcana.major_arcana.find((m) => m.id === c.cardId)!;
      return { ...c, name: cardData.name };
    });

    setDrawnCards(cardsWithNames);
    setPhase("cards");
  }

  const handleAllFlipped = useCallback(async () => {
    setPhase("reading");
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
      if (!res.ok) throw new Error(data.error || "API error");
      setReading(data.interpretation);
    } catch (err) {
      console.error(err);
      setReading("解讀過程中發生錯誤，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  }, [question, aspect, drawnCards]);

  function handleReset() {
    setPhase("input");
    setQuestion("");
    setAspect("core");
    setDrawnCards([]);
    setReading(null);
    setIsLoading(false);
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Star background */}
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

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {phase === "input" && <QuestionForm onSubmit={handleSubmit} />}

        {phase === "cards" && (
          <CardSpread cards={drawnCards} onAllFlipped={handleAllFlipped} />
        )}

        {phase === "reading" && (
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Show cards in mini form */}
            <div className="flex flex-wrap justify-center gap-4">
              {drawnCards.map((card) => (
                <div
                  key={card.cardId}
                  className="text-center px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {card.position}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--gold)" }}
                  >
                    {card.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color:
                        card.orientation === "upright" ? "#a8e6a3" : "#e6a3a8",
                    }}
                  >
                    {card.orientation === "upright" ? "正位" : "逆位"}
                  </div>
                </div>
              ))}
            </div>

            <ReadingResult
              reading={reading}
              isLoading={isLoading}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}
