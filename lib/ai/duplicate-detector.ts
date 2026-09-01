function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isDuplicateStem(stem: string, existing: string[]) {
  const target = normalize(stem);
  return existing.some((item) => {
    const other = normalize(item);
    if (other === target) return true;
    return other.includes(target) || target.includes(other);
  });
}
