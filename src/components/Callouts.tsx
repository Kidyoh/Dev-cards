"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { CardData } from "@/lib/types";

const REACH = 130;

/** Blue hairline callouts from features of the card out to mono labels (desktop only). */
export function Callouts({ card, children }: { card: CardData; children: ReactNode }) {
  const slab = card.rarity === "legacy";
  const W = slab ? 340 : 300, H = slab ? 530 : 420, ox = slab ? 20 : 0, oy = slab ? 100 : 0;
  const items = [
    { px: ox + 78, py: oy + 82, side: "l", ly: oy + 40, k: "Overall rating", v: `${card.overall} · ${card.rarity}` },
    { px: ox + 236, py: oy + 70, side: "r", ly: oy + 30, k: "Subject", v: `@${card.login}` },
    { px: ox + 96, py: oy + 290, side: "l", ly: oy + 300, k: "Stats · 06", v: card.role.name },
    { px: ox + 214, py: oy + 346, side: "r", ly: oy + 380, k: "Ability", v: card.abilities[0]?.name ?? "—" },
  ] as const;
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute top-0 hidden xl:block" style={{ left: -REACH, width: W + REACH * 2, height: H }}>
        <svg className="absolute inset-0 overflow-visible" width={W + REACH * 2} height={H} aria-hidden>
          {items.map((c, i) => {
            const x0 = c.px + REACH, y0 = c.py;
            const ex = c.side === "l" ? REACH - 20 : REACH + W + 20;
            const end = c.side === "l" ? 4 : W + REACH * 2 - 4;
            return (
              <g key={i} stroke="#2f3fc2" fill="none">
                <motion.path d={`M ${x0} ${y0} L ${ex} ${c.ly} L ${end} ${c.ly}`} strokeWidth={0.8} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }} />
                <rect x={x0 - 3} y={y0 - 3} width={6} height={6} fill="#fff" strokeWidth={0.8} />
              </g>
            );
          })}
        </svg>
        {items.map((c, i) => (
          <motion.div
            key={c.k}
            className="absolute font-mono uppercase text-blue"
            style={{ top: c.ly - 28, width: REACH - 26, ...(c.side === "l" ? { left: 4 } : { right: 4, textAlign: "right" as const }) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0, delay: 0.7 + i * 0.12 }}
          >
            <div className="text-[8.5px] text-blue/60">{c.k}</div>
            <div className="truncate text-[10.5px] font-semibold">{c.v}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
