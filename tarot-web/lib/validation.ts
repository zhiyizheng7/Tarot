import { Aspect } from "./prompts";

export const SUPPORTED_ASPECTS: Aspect[] = [
  "love",
  "career",
  "wealth",
  "relationships",
  "growth",
];

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateQuestion(question: string): ValidationResult {
  const trimmed = question.trim();

  if (trimmed.length < 5) {
    return { valid: false, message: "問題至少需要 5 個字。" };
  }
  if (trimmed.length > 100) {
    return { valid: false, message: "問題最多 100 個字。" };
  }

  const meaningfulPattern = /[\p{L}\p{N}]/u;
  if (!meaningfulPattern.test(trimmed)) {
    return { valid: false, message: "請輸入具體問題，避免僅使用符號。" };
  }

  return { valid: true };
}

export function isSupportedAspect(aspect: string): aspect is Aspect {
  return SUPPORTED_ASPECTS.includes(aspect as Aspect);
}
