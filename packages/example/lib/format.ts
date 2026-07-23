/**
 * Formats a number for display: 1_234 → "1.2k", 42 → "42".
 * This is an internal module — never import it from outside this package.
 */
export function formatVoteCount(count: number): string {
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}
