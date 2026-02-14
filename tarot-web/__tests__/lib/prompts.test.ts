import { buildReadingPrompt, type Aspect } from "@/lib/prompts";
import { drawCards, getCardWithData, type CardWithData } from "@/lib/tarot";

function getTestCards(): CardWithData[] {
  const drawn = drawCards();
  return drawn.map((d) => getCardWithData(d));
}

describe("buildReadingPrompt", () => {
  it("should include the user question", () => {
    const cards = getTestCards();
    const prompt = buildReadingPrompt(cards, "我的運勢如何？", "growth");
    expect(prompt).toContain("我的運勢如何？");
  });

  it("should include all three positions", () => {
    const cards = getTestCards();
    const prompt = buildReadingPrompt(cards, "感情問題", "love");
    expect(prompt).toContain("【過去】");
    expect(prompt).toContain("【現在】");
    expect(prompt).toContain("【未來】");
  });

  it("should include card names", () => {
    const cards = getTestCards();
    const prompt = buildReadingPrompt(cards, "工作問題", "career");
    cards.forEach((card) => {
      expect(prompt).toContain(card.name);
    });
  });

  it("should include orientation text", () => {
    const cards = getTestCards();
    const prompt = buildReadingPrompt(cards, "問題", "wealth");
    cards.forEach((card) => {
      const expected = card.orientation === "upright" ? "正位" : "逆位";
      expect(prompt).toContain(expected);
    });
  });

  it.each([
    ["love", "感情"],
    ["career", "事業"],
    ["wealth", "財運"],
    ["relationships", "人際"],
    ["growth", "自我成長"],
  ] as [Aspect, string][])('should include aspect label for %s', (aspect, label) => {
    const cards = getTestCards();
    const prompt = buildReadingPrompt(cards, "問題", aspect);
    expect(prompt).toContain(`占卜面向：${label}`);
  });

  it("should include required output sections", () => {
    const cards = getTestCards();
    const prompt = buildReadingPrompt(cards, "問題", "growth");
    expect(prompt).toContain("### 全局概述");
    expect(prompt).toContain("### 分項解析（過去）");
    expect(prompt).toContain("### 分項解析（現在）");
    expect(prompt).toContain("### 分項解析（未來）");
    expect(prompt).toContain("### 行動建議");
  });
});
