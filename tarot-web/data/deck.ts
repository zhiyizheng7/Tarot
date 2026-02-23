import majorArcanaData from "./major_arcana.json";
import wandsData from "./minor_wands.json";
import cupsData from "./minor_cups.json";
import swordsData from "./minor_swords.json";
import pentaclesData from "./minor_pentacles.json";

export interface TarotCardData {
  id: number;
  name: string;
  arcanaType: "major" | "minor";
  suit: "cups" | "wands" | "swords" | "pentacles" | null;
  rank: string | null;
  element: string;
  image_description: string;
  symbols: Record<string, string>;
  colors: Record<string, string>;
  upright: {
    core: string;
    love: string;
    career: string;
    action_advice: string;
  };
  reversed: {
    core: string;
    love: string;
    career: string;
    action_advice: string;
  };
}

export const ALL_CARDS: TarotCardData[] = [
  ...(majorArcanaData.major_arcana as TarotCardData[]),
  ...(wandsData.minor_wands as TarotCardData[]),
  ...(cupsData.minor_cups as TarotCardData[]),
  ...(swordsData.minor_swords as TarotCardData[]),
  ...(pentaclesData.minor_pentacles as TarotCardData[]),
];

export function getCardById(id: number): TarotCardData | undefined {
  return ALL_CARDS.find((card) => card.id === id);
}
