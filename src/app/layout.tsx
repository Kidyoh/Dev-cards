import type { Metadata } from "next";
import Link from "next/link";
import { Background } from "@/components/fx/Background";
import { MotionProvider } from "@/components/fx/MotionProvider";
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
        <Background />
        <header className="nav-wrap">
          <nav className="nav">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden />
              <span>DEV<b>CARDS</b></span>
            </Link>
            <div className="nav-links">
              <Link href="/leaderboard" className="link">Leaderboards</Link>
              <Link href="/compare" className="link">Compare</Link>
              <Link href="/binder" className="link">Binder</Link>
            </div>
          </nav>
        </header>
        <main><MotionProvider>{children}</MotionProvider></main>
      </body>
    </html>
  );
}
