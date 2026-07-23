import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProfilePageClient } from "../../../components/ProfilePageClient";
import { ApiClientError, fetchProfile } from "../../../lib/api";

type PageProps = {
  params: Promise<{ username: string }>;
};

const loadProfile = cache(async (username: string) => {
  try {
    return await fetchProfile(username);
  } catch (err) {
    // Treat any client error (401, 404, etc.) as "not found" for profile pages,
    // since a non-existent or inaccessible user should show the 404 page.
    if (err instanceof ApiClientError) {
      return null;
    }
    throw err;
  }
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username);

  if (!profile) {
    return {
      title: "User not found — BharatHunt",
      description: "This user does not exist.",
    };
  }

  const name = profile.user.name;
  const title = `${name} — BharatHunt`;
  const description = profile.user.bio ?? `View ${name}'s products on BharatHunt`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: profile.user.avatarUrl
        ? [{ url: profile.user.avatarUrl, alt: name }]
        : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile.user.avatarUrl ? [profile.user.avatarUrl] : undefined,
    },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await loadProfile(username);

  if (!profile) {
    notFound();
  }

  return <ProfilePageClient key={profile.user.id} initialProfile={profile} />;
}
