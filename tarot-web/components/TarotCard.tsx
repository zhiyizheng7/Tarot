"use client";

import { useEffect, useState } from "react";

interface TarotCardProps {
  name: string;
  position: "過去" | "現在" | "未來";
  orientation: "upright" | "reversed";
  isFlipped: boolean;
  delay?: number;
}

const POSITION_LABEL: Record<string, string> = {
  過去: "Past",
  現在: "Present",
  未來: "Future",
};

export default function TarotCard({
  name,
  position,
  orientation,
  isFlipped,
  delay = 0,
}: TarotCardProps) {
  const [showFlip, setShowFlip] = useState(false);

  useEffect(() => {
    if (!isFlipped) return;
    const timer = setTimeout(() => setShowFlip(true), delay);
    return () => clearTimeout(timer);
  }, [isFlipped, delay]);

  const orientationText = orientation === "upright" ? "正位" : "逆位";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Position label */}
      <span
        className="text-sm tracking-widest uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        {position} · {POSITION_LABEL[position]}
      </span>

      {/* Card */}
      <div className="card-scene tarot-card" style={{ width: 160, height: 260 }}>
        <div className={`card-inner ${showFlip ? "flipped" : ""}`}>
          {/* Back */}
          <div
            className="card-face card-back card-back-pattern"
            style={{
              border: "1px solid var(--card-border)",
            }}
          />

          {/* Front */}
          <div
            className="card-face card-front flex flex-col items-center justify-center gap-3 p-4 text-center"
            style={{
              background: "linear-gradient(180deg, var(--card-bg) 0%, #120e28 100%)",
              border: "1px solid var(--gold)",
              boxShadow: "inset 0 0 30px rgba(212, 175, 55, 0.05)",
            }}
          >
            {/* Decorative top */}
            <span
              className="text-xs tracking-widest"
              style={{ color: "var(--gold)", opacity: 0.6 }}
            >
              ✦ ✦ ✦
            </span>

            {/* Card name */}
            <h3
              className="text-lg font-bold leading-tight"
              style={{ color: "var(--gold)" }}
            >
              {name}
            </h3>

            {/* Divider */}
            <div
              className="w-12 h-px"
              style={{ background: "var(--gold)", opacity: 0.3 }}
            />

            {/* Orientation */}
            <span
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{
                color: orientation === "upright" ? "#a8e6a3" : "#e6a3a8",
                background:
                  orientation === "upright"
                    ? "rgba(168, 230, 163, 0.1)"
                    : "rgba(230, 163, 168, 0.1)",
                border: `1px solid ${
                  orientation === "upright"
                    ? "rgba(168, 230, 163, 0.2)"
                    : "rgba(230, 163, 168, 0.2)"
                }`,
              }}
            >
              {orientationText}
            </span>

            {/* Decorative bottom */}
            <span
              className="text-xs tracking-widest"
              style={{ color: "var(--gold)", opacity: 0.6 }}
            >
              ✦
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
