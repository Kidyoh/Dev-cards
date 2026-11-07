"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";
import { Bracket } from "./hud";

const TIER: Record<CardData["rarity"], string> = {
  bronze: "bg-[#6a3c18] text-[#f3c79a]",
  silver: "bg-[#5d6672] text-white",
  gold: "bg-ink text-lime",
  legacy: "bg-lime text-ink",
};

export function LeaderboardView({ cards, boardKey }: { cards: CardData[]; boardKey: string }) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<CardData | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 30 });
  const sy = useSpring(y, { stiffness: 300, damping: 30 });
  const top = cards.slice(0, 3);

  return (
    <div key={boardKey}>
      {top.length === 3 && (
        <div className="mt-12 grid gap-3 md:grid-cols-3">
          {top.map((c, i) => (
            <motion.div
              key={c.login}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 120, damping: 18 }}
              className={`relative flex flex-col items-center overflow-hidden rounded-3xl border pt-6 ${i === 0 ? "border-ink bg-ink text-sheet" : "border-line bg-white"}`}
            >
              <div className="flex w-full items-center justify-between px-5 font-mono text-[10px] uppercase tracking-[0.2em]">
                <span className={i === 0 ? "text-lime" : "text-mute"}>Rank_0{i + 1}</span>
                <span className="font-display text-3xl font-bold">#{i + 1}</span>
              </div>
              <Link href={`/u/${c.login}`} className="mt-4 transition-transform hover:-translate-y-1">
                <DevCard card={c} scale={0.6} flippable={false} slab={false} idle={i === 0} />
              </Link>
              <div className={`mt-4 w-full border-t px-5 py-3 font-mono text-[11px] ${i === 0 ? "border-white/10" : "border-line"}`}>
                @{c.login} · {c.overall} OVR
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div
        className="mt-3 overflow-hidden rounded-3xl border border-line bg-white"
        onPointerMove={(e) => {
          x.set(e.clientX + 28);
          y.set(e.clientY - 120);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <Bracket>Full lineup</Bracket>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">{cards.length} scanned</span>
        </div>
        <ol>
          {cards.map((c, i) => (
            <motion.li
              key={c.login}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.035, duration: 0 }}
              onPointerEnter={() => setHovered(c)}
              className="border-b border-line last:border-0"
            >
              <Link href={`/u/${c.login}`} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-6 py-3 transition-colors hover:bg-sheet sm:grid-cols-[36px_1fr_repeat(6,40px)_56px]">
                <span className="font-mono text-xs text-mute">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex min-w-0 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatarUrl} alt="" className="size-8 shrink-0 rounded-full border border-line" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${TIER[c.rarity]}`}>{c.rarity}</span>
                    </span>
                    <span className="block truncate font-mono text-[11px] text-mute underline decoration-ink/20 underline-offset-2">@{c.login}</span>
                  </span>
                </span>
                {(["SHP", "CON", "RNG", "DEP", "IMP", "COL"] as const).map((k) => (
                  <span key={k} className="hidden text-center font-mono text-xs text-mute tabular-nums sm:block" title={k}>
                    {c.stats[k]}
                  </span>
                ))}
                <span className="text-right font-display text-xl font-bold tabular-nums">{c.overall}</span>
              </Link>
            </motion.li>
          ))}
        </ol>
      </div>

      <AnimatePresence>
        {hovered && !reduce && (
          <motion.div
            key="peek"
            className="pointer-events-none fixed z-[60] hidden lg:block"
            style={{ left: sx, top: sy }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
          >
            <DevCard key={hovered.login} card={hovered} scale={0.5} flippable={false} interactive={false} slab={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
