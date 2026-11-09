"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Headline, Label, Win } from "@/components/bp";
import { BoardList } from "@/components/BoardList";
import { ScanInput } from "@/components/ScanInput";
import { fetchBoard } from "@/lib/api";
import { LANGUAGES } from "@/lib/board-config";
import type { CardData } from "@/lib/types";
import { cn } from "@/lib/utils";

function Opt({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("border px-1.5 py-[1px] font-mono text-[10.5px] uppercase", active ? "border-blue bg-blue text-white" : "border-blue/40 text-blue hover:border-blue")}>
      {children}
    </Link>
  );
}

export function BoardView() {
  const lang = useSearchParams().get("lang") ?? undefined;
  const active = lang ? LANGUAGES.find((l) => l.toLowerCase() === lang.toLowerCase()) : undefined;
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCards(null);
    setError(null);
    fetchBoard(active)
      .then((r) => setCards(r.cards))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Couldn't load the board"));
  }, [active]);

  return (
    <section className="px-4 pt-6 sm:px-6">
      <Label className="text-blue/60">Ranking · Ethiopia 🇪🇹</Label>
      <Headline className="mt-2 text-[clamp(44px,6.4vw,92px)]">
        Ethiopia&apos;s
        <br />
        top developers.
      </Headline>
      <p className="mt-3 max-w-xl font-mono text-[11px] uppercase leading-relaxed text-blue">
        Everyone scanned on Specsheet whose GitHub location is in Ethiopia, ranked by card. Scan yourself to join.
      </p>

      <div className="mt-8 grid gap-3 border border-blue bg-white p-3 md:grid-cols-[90px_1fr]">
        <Label className="pt-0.5">Language</Label>
        <div className="flex flex-wrap gap-1">
          <Opt href="/leaderboard" active={!active}>All</Opt>
          {LANGUAGES.map((l) => (
            <Opt key={l} href={`/leaderboard?lang=${encodeURIComponent(l)}`} active={active === l}>{l}</Opt>
          ))}
        </div>
      </div>

      <Headline as="h2" className="mt-12 text-[clamp(28px,3.4vw,44px)]">
        {active ? `Top ${active} devs` : "Top overall"}
      </Headline>
      {error ? (
        <div className="mt-6 border border-blue bg-white p-3 font-mono text-[12px] text-blue">{error}</div>
      ) : cards === null ? (
        <p className="mt-6 font-mono text-[11px] uppercase text-blue">
          Loading the board <span className="animate-blink">▮</span>
        </p>
      ) : cards.length === 0 ? (
        <div className="mt-6 max-w-md">
          <Win title="Board empty">
            <p className="mb-2 font-mono text-[10.5px] uppercase leading-snug text-blue">
              {active ? `No ${active} developers on the board yet.` : "Nobody on the board yet."} Be the first: scan yourself.
            </p>
            <ScanInput />
          </Win>
        </div>
      ) : (
        <>
          <p className="mt-2 font-mono text-[10px] uppercase text-blue/70">
            {cards.length} developer{cards.length === 1 ? "" : "s"} ranked
          </p>
          <BoardList key={active ?? "all"} cards={cards} />
        </>
      )}

      <div className="mt-12 max-w-xl">
        <Win title="How to get on the board">
          <ol className="space-y-1 font-mono text-[10.5px] uppercase leading-snug text-blue">
            <li>01. Set your GitHub profile location to Ethiopia or your city (Addis Ababa, Adama, Hawassa…)</li>
            <li>02. Scan your username on Specsheet</li>
            <li>03. Already scanned before? Open your card and hit Rescan</li>
          </ol>
        </Win>
      </div>
    </section>
  );
}
