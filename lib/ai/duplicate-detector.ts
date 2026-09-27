function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
// Exact normalized duplicates and near-identical token sets; this is not semantic/embedding matching.
export function isDuplicateStem(stem: string, existing: string[]) {
  const target = normalize(stem);
  const words = new Set(target.split(" "));
  return existing.some((item) => {
    const other = normalize(item);
    if (other === target) return true;
    const tokens = new Set(other.split(" "));
    if (Math.min(tokens.size, words.size) < 6) return false;
    const intersection = [...words].filter((word) => tokens.has(word)).length;
    return intersection / new Set([...words, ...tokens]).size >= 0.9;
  });
}
