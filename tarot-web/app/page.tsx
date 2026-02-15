"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { signIn, signOut, useSession } from "next-auth/react";
import { drawCards, type DrawnCard } from "@/lib/tarot";
import { Aspect } from "@/lib/prompts";
import { validateQuestion } from "@/lib/validation";
import QuestionForm from "@/components/QuestionForm";
import CardSpread from "@/components/CardSpread";
import ReadingResult from "@/components/ReadingResult";
import majorArcana from "@/data/major_arcana.json";

const TarotHero = dynamic(() => import("@/components/webgl/TarotHero"), {
  ssr: false,
});

const GlobalNebula = dynamic(() => import("@/components/webgl/GlobalNebula"), {
  ssr: false,
});

type Phase = "IDLE" | "THINKING" | "SHUFFLING" | "COMPLETED";

interface DrawnCardWithName {
  cardId: number;
  name: string;
  position: "過去" | "現在" | "未來";
  orientation: "upright" | "reversed";
}

interface ThreadSummary {
  id: string;
  title: string;
  updated_at: string;
}

interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards: DrawnCard[] | null;
  created_at: string;
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

function cardWithNames(cards: DrawnCard[]): DrawnCardWithName[] {
  return cards.map((card) => {
    const data = majorArcana.major_arcana.find((item) => item.id === card.cardId)!;
    return { ...card, name: data.name };
  });
}

export default function Home() {
  const { data: session, status } = useSession();

  const [phase, setPhase] = useState<Phase>("IDLE");
  const [question, setQuestion] = useState("");
  const [aspect, setAspect] = useState<Aspect>("love");
  const [drawnCards, setDrawnCards] = useState<DrawnCardWithName[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const stars = useMemo(() => generateStars(48), []);

  const fetchThreads = useCallback(async () => {
    if (!session?.user?.email) return;
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/threads");
      if (!res.ok) throw new Error("讀取歷史失敗");
      const data = await res.json();
      setThreads(data.threads ?? []);
    } catch {
      setThreads([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchThreads();
    }
  }, [status, fetchThreads]);

  function handleSubmit(q: string, a: Aspect) {
    if (status !== "authenticated") {
      setReading("請先登入，再開始占卜。\n\n可使用 Google 一鍵登入。\n");
      setPhase("COMPLETED");
      return;
    }

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
    setDrawnCards(cardWithNames(cards));
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
          threadId: activeThreadId,
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
      if (data.threadId) {
        setActiveThreadId(data.threadId);
      }
      await fetchThreads();
    } catch (err) {
      console.error(err);
      setReading("連結星際能量失敗，請重新翻牌。");
    } finally {
      setIsLoading(false);
      setPhase("COMPLETED");
    }
  }, [question, aspect, drawnCards, activeThreadId, fetchThreads]);

  async function handleOpenThread(threadId: string) {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/threads/${threadId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入歷史失敗");

      const messages: ThreadMessage[] = data.messages ?? [];
      const latestUser = [...messages].reverse().find((message) => message.role === "user");
      const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");

      if (latestUser?.cards && Array.isArray(latestUser.cards)) {
        setDrawnCards(cardWithNames(latestUser.cards));
      }
      setReading(latestAssistant?.content ?? "尚無解牌內容");
      setActiveThreadId(threadId);
      setPhase("COMPLETED");
    } catch {
      setReading("載入歷史失敗，請稍後再試。");
      setPhase("COMPLETED");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleDeleteThread(threadId: string) {
    await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
      setReading(null);
      setDrawnCards([]);
      setPhase("IDLE");
    }
    await fetchThreads();
  }

  function handleReset() {
    setPhase("IDLE");
    setQuestion("");
    setAspect("love");
    setDrawnCards([]);
    setReading(null);
    setIsLoading(false);
    setActiveThreadId(null);
  }

  return (
    <div className="app-shell relative min-h-screen px-4 py-8 sm:px-8">
      <GlobalNebula />

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

      <div className="relative z-10 mx-auto w-full max-w-6xl flex flex-col gap-6">
        <TarotHero />

        <div className="webgl-layout grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="panel-wrap h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="title-serif text-lg" style={{ color: "var(--accent-main)" }}>
                帳號與歷史
              </h2>
            </div>

            {status === "authenticated" ? (
              <>
                <div className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  {session.user?.name ?? session.user?.email}
                </div>
                <button className="quick-chip rounded-lg px-3 py-2 text-sm mb-5" onClick={() => signOut()}>
                  登出
                </button>
              </>
            ) : (
              <>
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  登入後可保存解牌歷史與回看對話。
                </p>
                <button className="btn-gold w-full rounded-lg py-2 text-sm" onClick={() => signIn("google")}>Google 登入</button>
              </>
            )}

            <div className="mt-4">
              <div className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                我的解牌歷史
              </div>
              <div className="flex flex-col gap-2 max-h-[420px] overflow-auto pr-1">
                {historyLoading && <div className="text-xs" style={{ color: "var(--text-secondary)" }}>載入中...</div>}
                {!historyLoading && threads.length === 0 && (
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>尚無歷史紀錄</div>
                )}
                {threads.map((thread) => (
                  <div key={thread.id} className="mini-card rounded-lg px-3 py-2">
                    <button
                      className="text-left w-full text-sm"
                      style={{ color: activeThreadId === thread.id ? "var(--accent-main)" : "var(--text-primary)" }}
                      onClick={() => handleOpenThread(thread.id)}
                    >
                      {thread.title}
                    </button>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {new Date(thread.updated_at).toLocaleString("zh-TW")}
                      </span>
                      <button
                        className="text-[11px]"
                        style={{ color: "var(--danger)" }}
                        onClick={() => handleDeleteThread(thread.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex flex-col items-center w-full gap-6">
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
          </main>
        </div>
      </div>
    </div>
  );
}
