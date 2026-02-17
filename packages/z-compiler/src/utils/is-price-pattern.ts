export const PRICE_PATTERN =
  /^\$(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?[KMBTkmbt]?$/;

function normalizeToken(token: string): string {
  return token.replace(/[+\-–—.,:;]+$/, "");
}

export function isPricePattern(text: string): boolean {
  const firstToken = text.trim().split(/\s+/)[0];
  const normalized = normalizeToken(firstToken);
  return PRICE_PATTERN.test(normalized);
}
