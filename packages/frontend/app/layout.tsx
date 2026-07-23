import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AuthProvider } from "../lib/auth/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "BharatHunt — Discover products built in India",
    template: "%s",
  },
  description:
    "Weekly product discovery for the Indian maker community. Launch, upvote, and discover what India is shipping.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    siteName: "BharatHunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-body">
        <AuthProvider>
          <Nav />
          <main className="flex-1">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
