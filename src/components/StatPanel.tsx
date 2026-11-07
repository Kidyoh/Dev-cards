"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { STAT_HINTS, STAT_LABELS, type CardData, type StatKey } from "@/lib/types";
import { CountUp } from "./fx/CountUp";
import { SegBar } from "./hud";

const KEYS: StatKey[] = ["SHP", "CON", "RNG", "DEP", "IMP", "COL"];

function point(i: number, r: number, c = 110) {
  const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
  return [c + Math.cos(a) * r, c + Math.sin(a) * r];
}

/** Blueprint-style hex radar. Up to two cards. */
export function StatRadar({ cards, colors = ["#121311", "#f5a93a"], fills = ["#d4f53c", "#f5a93a"] }: { cards: CardData[]; colors?: string[]; fills?: string[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const R = 84;
  const poly = (c: CardData) => KEYS.map((k, i) => point(i, (c.stats[k] / 100) * R).join(",")).join(" ");
  const zero = KEYS.map((_, i) => point(i, 0).join(",")).join(" ");
  return (
    <svg ref={ref} viewBox="0 0 220 220" className="w-full max-w-[240px] overflow-visible" role="img" aria-label="Stat radar">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={KEYS.map((_, i) => point(i, R * f).join(",")).join(" ")} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeDasharray={f === 1 ? undefined : "2 3"} />
      ))}
      {KEYS.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={110} y1={110} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.12} />;
      })}
      {cards.map((c, ci) => (
        <motion.polygon
          key={c.login + ci}
          points={zero}
          initial={{ points: zero }}
          animate={inView || reduce ? { points: poly(c) } : undefined}
          transition={{ duration: 0.9, delay: 0.1 + ci * 0.2, ease: [0.16, 1, 0.3, 1] }}
          fill={fills[ci]}
          fillOpacity={0.45}
          stroke={colors[ci]}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      {KEYS.map((k, i) => {
        const [x, y] = point(i, R + 15);
        return (
          <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-current font-mono text-[9px] font-bold opacity-60">
            {k}
          </text>
        );
      })}
    </svg>
  );
}

export function StatBars({ card }: { card: CardData }) {
  return (
    <div className="divide-y divide-line">
      {KEYS.map((k, i) => (
        <div key={k} className="grid grid-cols-[92px_1fr_34px] items-center gap-3 py-2.5" title={STAT_HINTS[k]}>
          <span className="leading-tight">
            <span className="block font-mono text-[11px] font-bold">{k}</span>
            <span className="block text-xs text-mute">{STAT_LABELS[k]}</span>
          </span>
          <SegBar value={card.stats[k]} segments={24} delay={0.15 + i * 0.07} />
          <b className="text-right font-display text-lg tabular-nums"><CountUp to={card.stats[k]} delay={0.15 + i * 0.07} /></b>
        </div>
      ))}
    </div>
  );
}
