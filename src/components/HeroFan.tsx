"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";

/** Three cards dealt into a fan; hovering the fan spreads them out. */
export function HeroFan({ cards }: { cards: CardData[] }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const n = cards.length;
  return (
    <div className="hero-fan" onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)}>
      {cards.map((c, i) => {
        const mid = (n - 1) / 2;
        const off = i - mid;
        return (
          <motion.div
            key={c.login}
            className="hero-fan-card"
            style={{ zIndex: off === 0 ? 3 : 2 - Math.abs(off) }}
            initial={{ y: 300, x: 0, rotate: 0, opacity: 0 }}
            animate={{
              x: off * (open ? 170 : 110),
              y: Math.abs(off) * (open ? 10 : 26),
              rotate: off * (open ? 4 : 9),
              opacity: 1,
            }}
            transition={{ type: "spring", stiffness: 110, damping: 15, delay: reduce ? 0 : open ? 0 : 0.25 + i * 0.12 }}
          >
            <Link href={`/u/${c.login}`} aria-label={`${c.name}'s card`}>
              <DevCard card={c} scale={0.74} flippable={false} idle={off === 0} />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
