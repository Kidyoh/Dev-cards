import type { Metadata } from "next";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import { MotionProvider } from "@/components/fx/MotionProvider";
import { Logo, Nav } from "@/components/Nav";
import { Barcode } from "@/components/hud";
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
        <Nav />
        <MotionProvider>
          <main className="flex flex-col gap-2 pt-2 sm:gap-3 sm:pt-3">{children}</main>
        </MotionProvider>
        <footer className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-5 py-10 font-mono text-[11px] uppercase tracking-[0.16em] text-mute sm:px-8">
          <Logo />
          <span>Public GitHub data · refreshed every 6h · no sign-in</span>
          <Barcode value="dev-cards-series-01" className="h-5 text-ink/70" />
        </footer>
      </body>
    </html>
  );
}
