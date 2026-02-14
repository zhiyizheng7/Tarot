import { CardWithData } from "./tarot";

export type Aspect = "love" | "career" | "wealth" | "relationships" | "growth";

const ASPECT_LABEL: Record<Aspect, string> = {
  love: "感情",
  career: "事業",
  wealth: "財運",
  relationships: "人際",
  growth: "自我成長",
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
    aspect === "love"
      ? card.meaning.love
      : aspect === "career"
      ? card.meaning.career
      : card.meaning.core;

  const aspectMeaningLabel =
    aspect === "love"
      ? "感情牌義"
      : aspect === "career"
      ? "事業牌義"
      : `${ASPECT_LABEL[aspect]}參考牌義`;

  return `【${card.position}】${card.name}（${orientationText}）
  元素：${card.element}
  牌面描述：${card.image_description}
  象徵符號：
${symbolLines}
  色彩意涵：
${colorLines}
  核心牌義：${card.meaning.core}
  ${aspectMeaningLabel}：${aspectMeaning}
  行動建議：${card.meaning.action_advice}`;
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

請嚴格依照以下標題與順序輸出：
### 全局概述
### 分項解析（過去）
### 分項解析（現在）
### 分項解析（未來）
### 行動建議

規則：
- 每一段都要呼應用戶問題中的關鍵詞。
- 「行動建議」請提供 2-3 條、可立即執行、具體可操作的建議。
- 不可省略任何段落標題。

語氣要求：溫暖而專業，既有神秘感又具備實用性。避免過於籠統的泛泛之談，請結合牌面細節給出有針對性的解讀。
請使用繁體中文回答。`;
}
