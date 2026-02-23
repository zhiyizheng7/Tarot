"use client";

import { useState, useCallback } from "react";
import { ALL_CARDS } from "@/data/deck";

interface PickedCard {
  cardId: number;
  name: string;
  position: "過去" | "現在" | "未來";
  orientation: "upright" | "reversed";
}

interface CardPickerProps {
  onComplete: (cards: PickedCard[]) => void;
}

const POSITIONS: Array<"過去" | "現在" | "未來"> = ["過去", "現在", "未來"];
const POSITION_LABELS: Record<string, string> = {
  過去: "Past",
  現在: "Present",
  未來: "Future",
};

const TOTAL_CARDS = ALL_CARDS.length;

export default function CardPicker({ onComplete }: CardPickerProps) {
  const [selected, setSelected] = useState<PickedCard[]>([]);
  const [done, setDone] = useState(false);

  const handlePick = useCallback(
    (cardId: number) => {
      if (done) return;
      if (selected.some((s) => s.cardId === cardId)) return;
      if (selected.length >= 3) return;

      const card = ALL_CARDS.find((c) => c.id === cardId)!;
      const position = POSITIONS[selected.length];
      const orientation: "upright" | "reversed" =
        Math.random() < 0.5 ? "upright" : "reversed";

      const picked: PickedCard = {
        cardId,
        name: card.name,
        position,
        orientation,
      };

      const next = [...selected, picked];
      setSelected(next);

      if (next.length === 3) {
        setDone(true);
        // Brief pause to show the 3rd selection before transitioning
        setTimeout(() => onComplete(next), 800);
      }
    },
    [selected, done, onComplete]
  );

  const currentPosition = POSITIONS[selected.length];
  const currentLabel = currentPosition
    ? `${currentPosition} · ${POSITION_LABELS[currentPosition]}`
    : "";

  return (
    <div className="fade-in flex flex-col items-center gap-6 w-full">
      {/* Header */}
      <div className="text-center">
        <h2
          className="text-xl font-light tracking-wide mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          聖三角牌陣
        </h2>
        {!done ? (
          <p
            className="text-sm"
            style={{ color: "var(--gold)" }}
          >
            選擇第 {selected.length + 1}/3 張牌 — {currentLabel}
          </p>
        ) : (
          <p
            className="text-sm"
            style={{ color: "var(--gold)" }}
          >
            已選擇完畢，即將揭牌...
          </p>
        )}
      </div>

      {/* Selected cards indicator */}
      <div className="flex gap-4">
        {POSITIONS.map((pos, i) => {
          const picked = selected[i];
          return (
            <div
              key={pos}
              className="text-center px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: picked ? "rgba(212, 175, 55, 0.15)" : "var(--card-bg)",
                border: `1px solid ${picked ? "var(--gold)" : "var(--card-border)"}`,
                color: picked ? "var(--gold)" : "var(--text-secondary)",
                minWidth: 72,
              }}
            >
              <div>{pos} · {POSITION_LABELS[pos]}</div>
              {picked && (
                <div className="mt-0.5 font-medium" style={{ fontSize: 11 }}>
                  {picked.name.split(" ")[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fan spread */}
      <div className="card-fan">
        {ALL_CARDS.map((card, i) => {
          const isSelected = selected.some((s) => s.cardId === card.id);
          const selectionIndex = selected.findIndex((s) => s.cardId === card.id);
          const isDisabled = done && !isSelected;

          // Fan angle: spread 78 cards across ~170 degrees, centered
          const angle = (i - (TOTAL_CARDS - 1) / 2) * 2.2;

          return (
            <button
              key={card.id}
              type="button"
              className={`fan-card card-back-pattern ${
                isSelected ? "selected" : ""
              } ${isDisabled ? "disabled" : ""}`}
              style={
                {
                  "--angle": `${angle}deg`,
                  "--index": i,
                  zIndex: isSelected ? 30 + selectionIndex : i,
                } as React.CSSProperties
              }
              onClick={() => handlePick(card.id)}
              disabled={isSelected || done}
              aria-label={`Card ${i + 1}`}
            >
              {isSelected && (
                <div className="fan-card-badge">
                  {selectionIndex + 1}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
