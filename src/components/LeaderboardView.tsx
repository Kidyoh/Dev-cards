"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";

const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
const HEIGHTS = [150, 110, 80];

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
        <div className="podium">
          {PODIUM_ORDER.map((idx, col) => {
            const c = top[idx];
            return (
              <motion.div
                key={c.login}
                className={`podium-slot place-${idx + 1}`}
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 90, damping: 14, delay: [0.35, 0.7, 0.15][col] }}
              >
                {idx === 0 && <div className="podium-rays" aria-hidden />}
                <Link href={`/u/${c.login}`} className="podium-card">
                  <DevCard card={c} scale={idx === 0 ? 0.62 : 0.5} flippable={false} idle />
                </Link>
                <div className="podium-block" style={{ height: HEIGHTS[idx] }}>
                  <span className="podium-num">{idx + 1}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div
        className="panel lb-wrap"
        onPointerMove={(e) => {
          x.set(e.clientX + 24);
          y.set(e.clientY - 140);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        <table className="lb">
          <thead>
            <tr>
              <th>#</th><th>Developer</th><th>Tier</th><th className="num">OVR</th>
              <th className="num">SHP</th><th className="num">CON</th><th className="num">RNG</th>
              <th className="num">DEP</th><th className="num">IMP</th><th className="num">COL</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c, i) => (
              <motion.tr
                key={c.login}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onPointerEnter={() => setHovered(c)}
                className={i < 3 ? `top top-${i + 1}` : ""}
              >
                <td>{i + 1}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatarUrl} alt="" />
                  <Link href={`/u/${c.login}`}>{c.name}</Link>
                </td>
                <td><span className={`pill ${c.rarity}`}>{c.rarity}</span></td>
                <td className="num"><b>{c.overall}</b></td>
                <td className="num">{c.stats.SHP}</td><td className="num">{c.stats.CON}</td>
                <td className="num">{c.stats.RNG}</td><td className="num">{c.stats.DEP}</td>
                <td className="num">{c.stats.IMP}</td><td className="num">{c.stats.COL}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* card preview that follows the pointer over the table (hidden on touch / small screens) */}
      <AnimatePresence>
        {hovered && !reduce && (
          <motion.div
            key="peek"
            className="lb-peek"
            style={{ left: sx, top: sy }}
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <DevCard key={hovered.login} card={hovered} scale={0.55} flippable={false} interactive={false} slab={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
