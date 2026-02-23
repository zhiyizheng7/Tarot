import { ALL_CARDS, getCardById } from "@/data/deck";

export interface DrawnCard {
  cardId: number;
  position: "過去" | "現在" | "未來";
  orientation: "upright" | "reversed";
}

export interface CardWithData extends DrawnCard {
  name: string;
  arcanaType: "major" | "minor";
  suit: "cups" | "wands" | "swords" | "pentacles" | null;
  rank: string | null;
  element: string;
  image_description: string;
  symbols: Record<string, string>;
  colors: Record<string, string>;
  meaning: {
    core: string;
    love: string;
    career: string;
    action_advice: string;
  };
}

const POSITIONS: Array<"過去" | "現在" | "未來"> = ["過去", "現在", "未來"];

export function drawCards(): DrawnCard[] {
  const indices = ALL_CARDS.map((_, i) => i);

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return POSITIONS.map((position, i) => ({
    cardId: ALL_CARDS[indices[i]].id,
    position,
    orientation: Math.random() < 0.5 ? "upright" : "reversed",
  }));
}

export function getCardWithData(
  drawn: DrawnCard,
  aspect: "love" | "career" | "core"
): CardWithData {
  const card = getCardById(drawn.cardId)!;
  const meanings = card[drawn.orientation];

  return {
    ...drawn,
    name: card.name,
    arcanaType: card.arcanaType,
    suit: card.suit,
    rank: card.rank,
    element: card.element,
    image_description: card.image_description,
    symbols: card.symbols as Record<string, string>,
    colors: card.colors as Record<string, string>,
    meaning: {
      core: meanings.core,
      love: meanings.love,
      career: meanings.career,
      action_advice: meanings.action_advice,
    },
  };
}
