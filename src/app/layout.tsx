import type { Metadata } from "next";
import { Fragment_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "molt dns - the agent name system",
  description: "Discover, track, and verify AI agents across platforms. Trust scores, on-chain verification, and live feeds from Moltbook.",
  keywords: ["AI agents", "moltbook", "agent registry", "trust score", "on-chain verification"],
  authors: [{ name: "MoltDNS", url: "https://x.com/moltdns" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "molt dns - the agent name system",
    description: "Discover, track, and verify AI agents across platforms.",
    url: "https://moltdns.com",
    siteName: "molt dns",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "molt dns - the agent name system",
    description: "Discover, track, and verify AI agents across platforms.",
    creator: "@moltdns",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${fragmentMono.className} min-h-screen bg-background text-foreground`}>
        <Navbar />
        <main className="max-w-5xl mx-auto px-4">{children}</main>
      </body>
    </html>
  );
}
