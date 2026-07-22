/**
 * Allow only same-origin relative paths for post-login redirects.
 * Blocks open redirects like `//evil.com` or `https://evil.com`.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return fallback
  if (trimmed.startsWith('//')) return fallback
  if (trimmed.includes('://')) return fallback
  if (trimmed.includes('\\')) return fallback
  return trimmed
}
