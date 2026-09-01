import type { GeneratedQuestionDraft } from "@/types";

export function validateQuestionDraft(draft: GeneratedQuestionDraft) {
  if (!draft.questionText || draft.questionText.length < 8) return false;
  if (!draft.options || draft.options.length !== 4) return false;
  const keys = draft.options.map((option) => option.key);
  if (new Set(keys).size !== 4) return false;
  if (!keys.includes(draft.correctAnswer)) return false;
  const texts = draft.options.map((option) => option.text.trim().toLowerCase());
  return new Set(texts).size === texts.length;
}
