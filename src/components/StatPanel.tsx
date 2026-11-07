"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { STAT_HINTS, STAT_LABELS, type CardData, type StatKey } from "@/lib/types";
import { CountUp } from "./fx/CountUp";

const KEYS: StatKey[] = ["SHP", "CON", "RNG", "DEP", "IMP", "COL"];

function point(i: number, r: number, c = 110) {
  const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
  return [c + Math.cos(a) * r, c + Math.sin(a) * r];
}

export function StatRadar({ cards, colors = ["#f5c84b", "#6c8bff"] }: { cards: CardData[]; colors?: string[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const R = 84;
  const poly = (c: CardData, f = 1) => KEYS.map((k, i) => point(i, (c.stats[k] / 100) * R * f).join(",")).join(" ");
  const zero = KEYS.map((_, i) => point(i, 0).join(",")).join(" ");
  return (
    <svg ref={ref} viewBox="0 0 220 220" className="radar" role="img" aria-label="Stat radar">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={KEYS.map((_, i) => point(i, R * f).join(",")).join(" ")} className="radar-ring" />
      ))}
      {KEYS.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={110} y1={110} x2={x} y2={y} className="radar-ring" />;
      })}
      {cards.map((c, ci) => (
        <motion.polygon
          key={c.login + ci}
          points={zero}
          initial={{ points: zero, opacity: 0 }}
          animate={inView || reduce ? { points: poly(c), opacity: 1 } : undefined}
          transition={{ duration: 1.1, delay: 0.15 + ci * 0.25, ease: [0.16, 1, 0.3, 1] }}
          fill={colors[ci]}
          fillOpacity={0.22}
          stroke={colors[ci]}
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 8px ${colors[ci]})` }}
        />
      ))}
      {KEYS.map((k, i) => {
        const [x, y] = point(i, R + 16);
        return (
          <text key={k} x={x} y={y} className="radar-label" textAnchor="middle" dominantBaseline="middle">
            {k}
          </text>
        );
      })}
    </svg>
  );
}

export function StatBars({ card }: { card: CardData }) {
  return (
    <div>
      {KEYS.map((k, i) => (
        <div key={k} className="statrow" title={STAT_HINTS[k]}>
          <span>{STAT_LABELS[k]}</span>
          <div className="bar">
            <motion.i
              initial={{ width: 0 }}
              whileInView={{ width: `${card.stats[k]}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <b style={{ textAlign: "right" }}><CountUp to={card.stats[k]} delay={0.1 + i * 0.08} /></b>
        </div>
      ))}
    </div>
  );
}
