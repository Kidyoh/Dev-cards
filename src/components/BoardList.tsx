"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { CardData } from "@/lib/types";
import { Bracket, Cells } from "./bp";
import { DevCard } from "./DevCard";

export function BoardList({ cards }: { cards: CardData[] }) {
  const [hovered, setHovered] = useState<CardData | null>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 320, damping: 32 }), sy = useSpring(y, { stiffness: 320, damping: 32 });

  return (
    <div>
      <div
        className="mt-8"
        onPointerMove={(e) => {
          x.set(e.clientX + 24);
          y.set(e.clientY - 110);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        <Bracket>Cards · {cards.length}</Bracket>
        <ol className="mt-2 border border-blue bg-white">
          {cards.map((c, i) => (
            <li key={c.login} onPointerEnter={() => setHovered(c)} className="border-b border-blue/25 last:border-0">
              <Link href={`/u/${c.login}`} className="grid grid-cols-[32px_1fr_44px] items-center gap-3 px-3 py-2 hover:bg-blue-wash sm:grid-cols-[32px_1fr_160px_70px_44px]">
                <span className="font-mono text-[10px] text-blue/60">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex min-w-0 items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatarUrl} alt="" className="size-7 shrink-0 border border-blue object-cover grayscale" />
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[12px] font-semibold uppercase text-blue">{c.name}</span>
                    <span className="block truncate font-mono text-[9.5px] text-blue/70">@{c.login}</span>
                  </span>
                </span>
                <Cells value={c.overall} count={14} className="hidden h-2.5 sm:flex" delay={0.2 + i * 0.03} />
                <span className="hidden font-mono text-[9.5px] uppercase text-blue sm:block">{c.rarity}</span>
                <span className="text-right font-serif text-2xl font-light text-blue">{c.overall}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            key="peek"
            className="pointer-events-none fixed z-50 hidden lg:block"
            style={{ left: sx, top: sy }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
          >
            <div className="border border-blue bg-white p-2">
              <DevCard key={hovered.login} card={hovered} scale={0.45} flippable={false} interactive={false} slab={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
