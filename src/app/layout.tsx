import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Dev Cards", template: "%s · Dev Cards" },
  description: "Turn any GitHub profile into a collectible card, with stats computed from real commits, languages and shipped projects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <Link href="/" className="brand">DEV<span>CARDS</span></Link>
          <Link href="/leaderboard" className="link">Leaderboards</Link>
          <Link href="/compare" className="link">Compare</Link>
          <Link href="/binder" className="link">My binder</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
