import { getInterpretation, type GeminiResponse } from "@/lib/gemini";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_API_URL = "https://api.example.com/generate";
  mockFetch.mockReset();
});

function mockSuccess(text: string) {
  const body: GeminiResponse = {
    candidates: [{ content: { parts: [{ text }] } }],
  };
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => body,
  });
}

describe("getInterpretation", () => {
  it("should send correct request to Gemini API", async () => {
    mockSuccess("解牌結果");

    await getInterpretation("test prompt");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/generate?key=test-key",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "test prompt" }] }],
        }),
      }
    );
  });

  it("should return the text from Gemini response", async () => {
    mockSuccess("這是一段塔羅解讀");

    const result = await getInterpretation("prompt");

    expect(result).toBe("這是一段塔羅解讀");
  });

  it("should throw on non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    });

    await expect(getInterpretation("prompt")).rejects.toThrow(
      "Gemini API error (429): Rate limit exceeded"
    );
  });

  it("should throw on empty response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] }),
    });

    await expect(getInterpretation("prompt")).rejects.toThrow(
      "Gemini API returned empty response"
    );
  });

  it("should throw on missing parts", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [] } }],
      }),
    });

    await expect(getInterpretation("prompt")).rejects.toThrow(
      "Gemini API returned empty response"
    );
  });
});
