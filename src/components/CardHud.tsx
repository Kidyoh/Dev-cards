"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import type { CardData } from "@/lib/types";
import { Decode } from "./hud";

type Callout = {
  /** point on the card (card-space px) */
  px: number;
  py: number;
  side: "left" | "right";
  /** label row (card-space y) */
  ly: number;
  k: string;
  v: string;
};

const REACH = 120; // how far labels sit outside the card

/**
 * Technical annotations around a card: hairlines from a feature on the card out to a mono label,
 * like the HUD diagrams in the reference. Desktop only (there's no room on phones).
 */
export function CardHud({ card, show, children }: { card: CardData; show: boolean; children: ReactNode }) {
  const isSlab = card.rarity === "legacy";
  const W = isSlab ? 340 : 300;
  const H = isSlab ? 530 : 420;
  const ox = isSlab ? 20 : 0; // where the card sits inside the slab
  const oy = isSlab ? 100 : 0;

  const callouts: Callout[] = [
    { px: ox + 78, py: oy + 82, side: "left", ly: oy + 50, k: "Overall", v: `${card.overall} · ${card.rarity}` },
    { px: ox + 236, py: oy + 70, side: "right", ly: oy + 34, k: "Subject", v: `@${card.login}` },
    { px: ox + 96, py: oy + 290, side: "left", ly: oy + 300, k: "Stats · 06", v: `Best: ${card.role.name}` },
    { px: ox + 214, py: oy + 346, side: "right", ly: oy + 372, k: "Ability", v: card.abilities[0]?.name ?? "—" },
  ];

  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            key="hud"
            className="pointer-events-none absolute top-0 hidden xl:block"
            style={{ left: -REACH, width: W + REACH * 2, height: H }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <svg className="absolute inset-0 overflow-visible" width={W + REACH * 2} height={H} aria-hidden>
              {callouts.map((c, i) => {
                const x0 = c.px + REACH;
                const y0 = c.py;
                const elbowX = c.side === "left" ? REACH - 24 : REACH + W + 24;
                const endX = c.side === "left" ? 8 : W + REACH * 2 - 8;
                const d = `M ${x0} ${y0} L ${elbowX} ${c.ly} L ${endX} ${c.ly}`;
                return (
                  <g key={i}>
                    <motion.path
                      d={d}
                      fill="none"
                      stroke="var(--color-ink)"
                      strokeWidth={1}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.55, delay: 0.25 + i * 0.12, ease: "easeOut" }}
                    />
                    <motion.rect
                      x={x0 - 3.5}
                      y={y0 - 3.5}
                      width={7}
                      height={7}
                      fill="var(--color-sheet)"
                      stroke="var(--color-ink)"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 400, damping: 18 }}
                      style={{ transformOrigin: `${x0}px ${y0}px` }}
                    />
                  </g>
                );
              })}
            </svg>
            {callouts.map((c, i) => (
              <motion.div
                key={c.k}
                className="absolute font-mono uppercase"
                style={{
                  top: c.ly - 30,
                  ...(c.side === "left" ? { left: 8 } : { right: 8, textAlign: "right" as const }),
                  width: REACH - 30,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.12 }}
              >
                <div className="text-[9px] font-semibold tracking-[0.2em] text-mute">{c.k}</div>
                <div className="truncate text-[11px] font-bold tracking-[0.06em] text-ink">
                  <Decode text={c.v} speed={25} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
