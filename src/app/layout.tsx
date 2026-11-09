import type { Metadata } from "next";
import "@fontsource/zilla-slab/300.css";
import "@fontsource/zilla-slab/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import { Analytics } from "@vercel/analytics/next";
import { Barcode, TopBar } from "@/components/bp";
import { MotionProvider } from "@/components/fx/MotionProvider";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Specsheet", template: "%s · Specsheet" },
  description: "Turn any GitHub profile into a collectible card, with stats computed from real commits, languages and shipped projects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grid-paper min-h-screen">
        <TopBar />
        <MotionProvider>
          <main>{children}</main>
        </MotionProvider>
        <footer className="mx-4 mt-16 flex flex-wrap items-end justify-between gap-4 border-t border-blue/40 py-4 font-mono text-[10px] uppercase text-blue sm:mx-6">
          <span>Specsheet · Series 01</span>
          <span className="text-blue/70">Public GitHub data · refreshed every 6h · no sign-in</span>
          <Barcode value="specsheet" />
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
