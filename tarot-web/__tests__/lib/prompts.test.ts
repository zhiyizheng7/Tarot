import { buildReadingPrompt, type Aspect } from "@/lib/prompts";
import { drawCards, getCardWithData, type CardWithData } from "@/lib/tarot";

function getTestCards(aspect: Aspect): CardWithData[] {
  const drawn = drawCards();
  return drawn.map((d) => getCardWithData(d, aspect));
}

describe("buildReadingPrompt", () => {
  it("should include the user question", () => {
    const cards = getTestCards("core");
    const prompt = buildReadingPrompt(cards, "我的運勢如何？", "core");
    expect(prompt).toContain("我的運勢如何？");
  });

  it("should include all three positions", () => {
    const cards = getTestCards("love");
    const prompt = buildReadingPrompt(cards, "感情問題", "love");
    expect(prompt).toContain("【過去】");
    expect(prompt).toContain("【現在】");
    expect(prompt).toContain("【未來】");
  });

  it("should include card names", () => {
    const cards = getTestCards("career");
    const prompt = buildReadingPrompt(cards, "工作問題", "career");
    cards.forEach((card) => {
      expect(prompt).toContain(card.name);
    });
  });

  it("should include orientation text", () => {
    const cards = getTestCards("core");
    const prompt = buildReadingPrompt(cards, "問題", "core");
    cards.forEach((card) => {
      const expected = card.orientation === "upright" ? "正位" : "逆位";
      expect(prompt).toContain(expected);
    });
  });

  it("should include aspect label for love", () => {
    const cards = getTestCards("love");
    const prompt = buildReadingPrompt(cards, "問題", "love");
    expect(prompt).toContain("占卜面向：感情");
    expect(prompt).toContain("感情牌義");
  });

  it("should include aspect label for career", () => {
    const cards = getTestCards("career");
    const prompt = buildReadingPrompt(cards, "問題", "career");
    expect(prompt).toContain("占卜面向：事業");
    expect(prompt).toContain("事業牌義");
  });

  it("should NOT include extra aspect line for core", () => {
    const cards = getTestCards("core");
    const prompt = buildReadingPrompt(cards, "問題", "core");
    expect(prompt).toContain("占卜面向：綜合");
    expect(prompt).not.toContain("綜合牌義");
  });

  it("should include image description, symbols, and colors", () => {
    const cards = getTestCards("core");
    const prompt = buildReadingPrompt(cards, "問題", "core");
    cards.forEach((card) => {
      expect(prompt).toContain(card.image_description);
      expect(prompt).toContain(card.element);
    });
  });

  it("should include action advice for each card", () => {
    const cards = getTestCards("core");
    const prompt = buildReadingPrompt(cards, "問題", "core");
    cards.forEach((card) => {
      expect(prompt).toContain(card.meaning.action_advice);
    });
  });
});
