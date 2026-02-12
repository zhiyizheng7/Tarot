"use client";

import { useEffect, useState } from "react";
import TarotCard from "./TarotCard";

interface CardData {
  cardId: number;
  name: string;
  position: "過去" | "現在" | "未來";
  orientation: "upright" | "reversed";
}

interface CardSpreadProps {
  cards: CardData[];
  onAllFlipped: () => void;
}

export default function CardSpread({ cards, onAllFlipped }: CardSpreadProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Start flipping after a brief pause
    const startTimer = setTimeout(() => setIsFlipped(true), 400);
    // Signal all flipped after the last card finishes (400ms start + 800ms delay for 3rd card + 800ms animation)
    const doneTimer = setTimeout(() => onAllFlipped(), 400 + 800 + 900);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(doneTimer);
    };
  }, [onAllFlipped]);

  return (
    <div className="fade-in flex flex-col items-center gap-8">
      <h2
        className="text-xl font-light tracking-wide"
        style={{ color: "var(--text-secondary)" }}
      >
        聖三角牌陣
      </h2>

      <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
        {cards.map((card, i) => (
          <TarotCard
            key={card.cardId}
            name={card.name}
            position={card.position}
            orientation={card.orientation}
            isFlipped={isFlipped}
            delay={i * 400}
          />
        ))}
      </div>
    </div>
  );
}
