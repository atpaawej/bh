import type { Metadata } from "next";
import { SettingsPageClient } from "../../components/SettingsPageClient";

export const metadata: Metadata = {
  title: "Settings — BharatHunt",
  description: "Edit your BharatHunt profile.",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
