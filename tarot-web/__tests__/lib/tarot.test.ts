import { drawCards, type DrawnCard } from "@/lib/tarot";

describe("drawCards", () => {
  it("should return exactly 3 cards", () => {
    const result = drawCards();
    expect(result).toHaveLength(3);
  });

  it("should assign correct positions", () => {
    const result = drawCards();
    expect(result[0].position).toBe("過去");
    expect(result[1].position).toBe("現在");
    expect(result[2].position).toBe("未來");
  });

  it("should not have duplicate cards", () => {
    const result = drawCards();
    const ids = result.map((c) => c.cardId);
    expect(new Set(ids).size).toBe(3);
  });

  it("should have upright or reversed for each card", () => {
    const result = drawCards();
    result.forEach((card) => {
      expect(["upright", "reversed"]).toContain(card.orientation);
    });
  });
});
