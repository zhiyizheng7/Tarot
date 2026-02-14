"use client";

interface ReadingResultProps {
  reading: string | null;
  isLoading: boolean;
  onReset: () => void;
}

function renderLine(line: string, index: number) {
  const trimmed = line.trim();
  if (!trimmed) {
    return <div key={`blank-${index}`} className="h-2" />;
  }

  if (trimmed.startsWith("### ")) {
    return (
      <h3 key={index} className="result-h3">
        {trimmed.slice(4)}
      </h3>
    );
  }

  if (trimmed.startsWith("## ")) {
    return (
      <h2 key={index} className="result-h2">
        {trimmed.slice(3)}
      </h2>
    );
  }

  if (trimmed.startsWith("- ")) {
    return (
      <p key={index} className="result-line">
        • {trimmed.slice(2)}
      </p>
    );
  }

  return (
    <p key={index} className="result-line">
      {trimmed}
    </p>
  );
}

export default function ReadingResult({
  reading,
  isLoading,
  onReset,
}: ReadingResultProps) {
  if (isLoading) {
    return (
      <div className="fade-in flex flex-col items-center gap-6 py-8">
        <div className="pulse-glow w-16 h-16 rounded-full flex items-center justify-center loading-badge">
          <span className="text-2xl" style={{ color: "var(--accent-main)" }}>
            ✦
          </span>
        </div>
        <p style={{ color: "var(--text-secondary)" }}>
          占卜師正在解讀牌陣
          <span className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      </div>
    );
  }

  if (!reading) return null;

  return (
    <div className="fade-in flex flex-col gap-6 w-full max-w-3xl">
      <div className="result-panel rounded-xl p-6 sm:p-8">
        <div className="text-sm sm:text-base" style={{ color: "var(--text-primary)", lineHeight: 1.9 }}>
          {reading.split("\n").map((line, index) => renderLine(line, index))}
        </div>
      </div>

      <button onClick={onReset} className="btn-gold py-3 rounded-xl text-base cursor-pointer">
        重新占卜
      </button>
    </div>
  );
}
