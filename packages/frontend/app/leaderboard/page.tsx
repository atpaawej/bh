import type { Metadata } from "next";
import { Suspense } from "react";
import { LeaderboardFeed } from "../../components/LeaderboardFeed";

export const metadata: Metadata = {
  title: "Leaderboard — BharatHunt",
  description:
    "Community-ranked products by week. See what India is shipping, ranked by votes.",
  openGraph: {
    title: "Leaderboard — BharatHunt",
    description:
      "Community-ranked products by week. See what India is shipping, ranked by votes.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leaderboard — BharatHunt",
    description:
      "Community-ranked products by week. See what India is shipping, ranked by votes.",
  },
};

export default function LeaderboardPage() {
  return (
    <Suspense>
      <LeaderboardFeed />
    </Suspense>
  );
}
