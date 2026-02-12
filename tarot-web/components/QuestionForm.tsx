"use client";

import { useState } from "react";
import { Aspect } from "@/lib/prompts";

interface QuestionFormProps {
  onSubmit: (question: string, aspect: Aspect) => void;
}

const ASPECTS: { value: Aspect; label: string; icon: string }[] = [
  { value: "love", label: "感情", icon: "♥" },
  { value: "career", label: "事業", icon: "★" },
  { value: "core", label: "綜合", icon: "◆" },
];

export default function QuestionForm({ onSubmit }: QuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [aspect, setAspect] = useState<Aspect>("core");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    onSubmit(question.trim(), aspect);
  }

  return (
    <form onSubmit={handleSubmit} className="fade-in flex flex-col gap-8 w-full max-w-lg">
      {/* Title */}
      <div className="text-center">
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-wide mb-2"
          style={{ color: "var(--gold)" }}
        >
          ✦ 塔羅占卜 ✦
        </h1>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm">
          聖三角牌陣 · 過去—現在—未來
        </p>
      </div>

      {/* Question input */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="question"
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          請輸入你的問題
        </label>
        <textarea
          id="question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如：我的感情近期會有什麼發展？"
          className="w-full rounded-lg p-4 text-base resize-none outline-none focus:ring-1"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
            caretColor: "var(--gold)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--gold)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--card-border)")
          }
        />
      </div>

      {/* Aspect selector */}
      <div className="flex flex-col gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          占卜面向
        </span>
        <div className="flex gap-3">
          {ASPECTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setAspect(a.value)}
              className={`aspect-btn flex-1 py-2.5 rounded-lg text-sm cursor-pointer ${
                aspect === a.value ? "active" : ""
              }`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!question.trim()}
        className="btn-gold py-3 rounded-lg text-base cursor-pointer"
      >
        開始占卜
      </button>
    </form>
  );
}
