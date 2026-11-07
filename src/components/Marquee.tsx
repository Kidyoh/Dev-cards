"use client";

import Link from "next/link";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";

/** Infinitely scrolling row of cards that pauses on hover. */
export function Marquee({ cards, reverse = false, speed = 40 }: { cards: CardData[]; reverse?: boolean; speed?: number }) {
  if (!cards.length) return null;
  const loop = [...cards, ...cards];
  return (
    <div className="marquee" style={{ ["--dur" as string]: `${(cards.length * 220) / speed}s` }}>
      <div className={`marquee-track ${reverse ? "rev" : ""}`}>
        {loop.map((c, i) => (
          <Link key={`${c.login}-${i}`} href={`/u/${c.login}`} className="marquee-item" aria-hidden={i >= cards.length} tabIndex={i >= cards.length ? -1 : undefined}>
            <DevCard card={c} scale={0.52} flippable={false} slab={false} />
          </Link>
        ))}
      </div>
    </div>
  );
}
