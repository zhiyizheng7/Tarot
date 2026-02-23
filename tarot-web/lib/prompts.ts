import { CardWithData } from "./tarot";

export type Aspect = "love" | "career" | "core";

const ASPECT_LABEL: Record<Aspect, string> = {
  love: "感情",
  career: "事業",
  core: "綜合",
};

const SUIT_LABEL: Record<string, string> = {
  wands: "權杖",
  cups: "聖杯",
  swords: "寶劍",
  pentacles: "錢幣",
};

function formatCard(card: CardWithData, aspect: Aspect): string {
  const orientationText = card.orientation === "upright" ? "正位" : "逆位";

  const symbolLines = Object.entries(card.symbols)
    .map(([symbol, meaning]) => `    ${symbol}：${meaning}`)
    .join("\n");

  const colorLines = Object.entries(card.colors)
    .map(([color, meaning]) => `    ${color}：${meaning}`)
    .join("\n");

  const aspectMeaning =
    aspect === "core" ? card.meaning.core : card.meaning[aspect];

  const arcanaLine = card.arcanaType === "minor" && card.suit
    ? `\n  牌組：小阿爾克那 — ${SUIT_LABEL[card.suit]}`
    : `\n  牌組：大阿爾克那`;

  return `【${card.position}】${card.name}（${orientationText}）
  元素：${card.element}${arcanaLine}
  牌面描述：${card.image_description}
  象徵符號：
${symbolLines}
  色彩意涵：
${colorLines}
  核心牌義：${card.meaning.core}
  ${aspect !== "core" ? `${ASPECT_LABEL[aspect]}牌義：${aspectMeaning}\n  ` : ""}行動建議：${card.meaning.action_advice}`;
}

export function buildReadingPrompt(
  cards: CardWithData[],
  question: string,
  aspect: Aspect
): string {
  const cardsSection = cards.map((c) => formatCard(c, aspect)).join("\n\n");

  return `你是一位專業的塔羅占卜師，擁有豐富的牌義解讀經驗。
請根據以下聖三角牌陣（過去—現在—未來）的抽牌結果，為用戶提供深入且具有洞察力的解讀。

用戶的問題：「${question}」
占卜面向：${ASPECT_LABEL[aspect]}

--- 抽牌結果 ---

${cardsSection}

--- 解讀要求 ---

請依照以下結構進行分析：
1. 整體概覽：簡要說明三張牌呈現的整體故事線與能量走向。
2. 逐牌解析：針對每個時間位置（過去、現在、未來），結合牌面描述、象徵符號與色彩意涵，提供具體且有層次的解讀。若牌為小阿爾克那，請結合其牌組特性（權杖＝行動與熱情、聖杯＝情感與直覺、寶劍＝思維與挑戰、錢幣＝物質與穩定）進行分析。
3. 牌與牌之間的關聯：說明三張牌之間的連結與故事發展脈絡。
4. 具體行動建議：根據整體牌陣，提供 2-3 條明確可執行的行動建議。

語氣要求：溫暖而專業，既有神秘感又具備實用性。避免過於籠統的泛泛之談，請結合牌面細節給出有針對性的解讀。
請使用繁體中文回答。`;
}
