/**
 * Convert a public video URL into an embeddable iframe src when possible.
 * Returns null for unknown hosts so callers can fall back to an external link.
 */
export function toVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      const shorts = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/)
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`
      const embed = parsed.pathname.match(/^\/embed\/([a-zA-Z0-9_-]+)/)
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`
      return null
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/)
      return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : null
    }

    return null
  } catch {
    return null
  }
}
