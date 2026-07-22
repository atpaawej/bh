import { formatVoteCount } from './lib/format'

/**
 * Returns a human-readable summary of a product's engagement.
 * The real work is delegated to internal modules — this is the public face.
 */
export function engagementSummary(voteCount: number, commentCount: number): string {
  return `${formatVoteCount(voteCount)} votes · ${commentCount} comments`
}
