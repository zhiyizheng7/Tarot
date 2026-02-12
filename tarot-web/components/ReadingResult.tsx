"use client";

interface ReadingResultProps {
  reading: string | null;
  isLoading: boolean;
  onReset: () => void;
}

export default function ReadingResult({
  reading,
  isLoading,
  onReset,
}: ReadingResultProps) {
  if (isLoading) {
    return (
      <div className="fade-in flex flex-col items-center gap-6 py-8">
        <div
          className="pulse-glow w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <span className="text-2xl" style={{ color: "var(--gold)" }}>
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

  // Simple markdown-like rendering: bold, headings, line breaks
  const rendered = reading
    .split("\n")
    .map((line) => {
      // Headings (## or ** at line start)
      if (line.startsWith("## ")) {
        return `<h3 style="color: var(--gold); margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1.15rem;">${line.slice(3)}</h3>`;
      }
      if (line.startsWith("# ")) {
        return `<h2 style="color: var(--gold); margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1.3rem;">${line.slice(2)}</h2>`;
      }
      // Bold
      const withBold = line.replace(
        /\*\*(.+?)\*\*/g,
        '<strong style="color: var(--gold);">$1</strong>'
      );
      if (!withBold.trim()) return "<br />";
      return `<p style="margin-bottom: 0.4rem; line-height: 1.8;">${withBold}</p>`;
    })
    .join("");

  return (
    <div className="fade-in flex flex-col gap-6 w-full max-w-2xl">
      {/* Result content */}
      <div
        className="rounded-xl p-6 sm:p-8"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
        }}
      >
        <div
          className="text-sm sm:text-base"
          style={{ color: "var(--text-primary)", lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="btn-gold py-3 rounded-lg text-base cursor-pointer"
      >
        重新占卜
      </button>
    </div>
  );
}
