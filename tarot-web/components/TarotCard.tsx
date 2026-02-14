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
      <span className="text-sm tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
        {position} · {POSITION_LABEL[position]}
      </span>

      <div className="card-scene tarot-card" style={{ width: 160, height: 260 }}>
        <div className={`card-inner ${showFlip ? "flipped" : ""}`}>
          <div className="card-face card-back card-back-pattern" style={{ border: "1px solid var(--panel-border)" }} />

          <div
            className="card-face card-front flex flex-col items-center justify-center gap-3 p-4 text-center"
            style={{
              background: "linear-gradient(180deg, var(--panel-bg) 0%, var(--panel-strong) 100%)",
              border: "1px solid var(--accent-main)",
              boxShadow: "inset 0 0 28px rgba(243, 200, 117, 0.08)",
            }}
          >
            <span className="text-xs tracking-widest" style={{ color: "var(--accent-main)", opacity: 0.7 }}>
              ✦ ✦ ✦
            </span>

            <h3 className="text-lg font-semibold leading-tight title-serif" style={{ color: "var(--accent-main)" }}>
              {name}
            </h3>

            <div className="w-12 h-px" style={{ background: "var(--accent-main)", opacity: 0.38 }} />

            <span
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{
                color: orientation === "upright" ? "#8de3bd" : "#ff9f7f",
                background: orientation === "upright" ? "rgba(141, 227, 189, 0.12)" : "rgba(255, 159, 127, 0.12)",
                border: `1px solid ${orientation === "upright" ? "rgba(141, 227, 189, 0.28)" : "rgba(255, 159, 127, 0.28)"}`,
              }}
            >
              {orientationText}
            </span>

            <span className="text-xs tracking-widest" style={{ color: "var(--accent-main)", opacity: 0.55 }}>
              ✦
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
