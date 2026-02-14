"use client";

import { useMemo, useState } from "react";
import { Aspect } from "@/lib/prompts";
import { validateQuestion } from "@/lib/validation";

interface QuestionFormProps {
  onSubmit: (question: string, aspect: Aspect) => void;
}

const ASPECTS: { value: Aspect; label: string; icon: string }[] = [
  { value: "love", label: "感情", icon: "♥" },
  { value: "career", label: "事業", icon: "◆" },
  { value: "wealth", label: "財運", icon: "◈" },
  { value: "relationships", label: "人際", icon: "✦" },
  { value: "growth", label: "自我成長", icon: "☉" },
];

const QUICK_QUESTIONS: Record<Aspect, string[]> = {
  love: [
    "我們最近的關係為什麼卡住了？",
    "這段關係接下來三個月會怎麼發展？",
  ],
  career: [
    "我該不該在今年轉職？",
    "目前職場衝突我該怎麼處理比較好？",
  ],
  wealth: ["我今年的收入有機會提升嗎？", "近期投資策略應該保守還是積極？"],
  relationships: [
    "我和這位同事的溝通為何一直不順？",
    "我該如何修復與家人的關係？",
  ],
  growth: ["我現在最需要突破的內在課題是什麼？", "我該先放下什麼，才能往前走？"],
};

export default function QuestionForm({ onSubmit }: QuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [aspect, setAspect] = useState<Aspect>("love");

  const validation = useMemo(() => validateQuestion(question), [question]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.valid) return;
    onSubmit(question.trim(), aspect);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fade-in panel-wrap flex flex-col gap-8 w-full max-w-2xl"
    >
      <div className="text-center">
        <h1
          className="text-3xl sm:text-5xl font-semibold tracking-wide mb-3 title-serif"
          style={{ color: "var(--accent-main)" }}
        >
          Arcana Mirror
        </h1>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm sm:text-base">
          聖三角牌陣 · 過去 · 現在 · 未來
        </p>
      </div>

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
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如：我今年會遇到適合長期發展的對象嗎？"
          className="w-full rounded-xl p-4 text-base resize-none outline-none focus:ring-1"
          style={{
            background: "var(--panel-strong)",
            border: "1px solid var(--panel-border)",
            color: "var(--text-primary)",
            caretColor: "var(--accent-main)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-main)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--panel-border)")}
        />
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: validation.valid ? "var(--text-secondary)" : "var(--danger)" }}>
            {validation.valid ? "建議輸入具體情境，解讀會更精準" : validation.message}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>{question.trim().length}/100</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          占卜面向
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          快速提問
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS[aspect].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className="quick-chip rounded-full px-3 py-1.5 text-xs sm:text-sm"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!validation.valid}
        className="btn-gold py-3 rounded-xl text-base cursor-pointer"
      >
        開始洗牌
      </button>
    </form>
  );
}
