export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const PRIMARY_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite";
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function getApiUrl(model: string): string {
  const configuredUrl = process.env.GEMINI_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }
  return `${GEMINI_BASE_URL}/${model}:generateContent`;
}

function extractText(data: GeminiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part) => part.text ?? "").join("\n").trim();
  if (!text) {
    throw new Error("Gemini API returned empty response");
  }
  return text;
}

async function requestWithModel(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${getApiUrl(model)}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        const error = new Error(`Gemini API error (${res.status}): ${errorText}`);
        lastError = error;

        if (RETRYABLE_STATUS.has(res.status) && attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
          continue;
        }
        throw error;
      }

      const data: GeminiResponse = await res.json();
      return extractText(data);
    }

    throw lastError ?? new Error("Gemini API request failed");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Gemini API timeout: request exceeded 9 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getInterpretation(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY env var");
  }

  try {
    return await requestWithModel(prompt, apiKey, PRIMARY_MODEL);
  } catch (primaryError) {
    return requestWithModel(prompt, apiKey, FALLBACK_MODEL).catch(() => {
      throw primaryError;
    });
  }
}
