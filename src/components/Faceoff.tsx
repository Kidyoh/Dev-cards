"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { STAT_LABELS, type CardData, type StatKey } from "@/lib/types";
import { DevCard } from "./DevCard";
import { CountUp } from "./fx/CountUp";
import { Decode, SegBar } from "./hud";
import { StatRadar } from "./StatPanel";

const KEYS = Object.keys(STAT_LABELS) as StatKey[];

function Side({ card, label, color, from, winner }: { card: CardData; label: string; color: string; from: number; winner: boolean }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ x: from, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 110, damping: 18 }}
    >
      <div className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md text-[10px] font-bold text-ink" style={{ background: color }}>{label}</span>
          @{card.login}
        </span>
        {winner && <span className="rounded-sm bg-ink px-1.5 py-0.5 font-bold text-lime">Winner</span>}
      </div>
      <Link href={`/u/${card.login}`} className={winner ? "" : "opacity-90"}>
        <DevCard card={card} scale={0.82} flippable={false} idle />
      </Link>
    </motion.div>
  );
}

export function Faceoff({ left, right }: { left: CardData; right: CardData }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce) {
      setStage(2);
      return;
    }
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 500 + KEYS.length * 180 + 600);
    return () => [t1, t2].forEach(clearTimeout);
  }, [run, reduce]);

  const lw = KEYS.filter((k) => left.stats[k] > right.stats[k]).length;
  const rw = KEYS.filter((k) => right.stats[k] > left.stats[k]).length;
  const winner = left.overall === right.overall ? (lw === rw ? null : lw > rw ? left : right) : left.overall > right.overall ? left : right;
  const verdict = !winner
    ? "Dead even."
    : left.overall === right.overall
      ? `${winner.name} edges it on stats.`
      : `${winner.name} takes it by ${Math.abs(left.overall - right.overall)}.`;

  return (
    <div key={run} className="mt-12 grid items-start gap-10 xl:grid-cols-[1fr_440px_1fr]">
      <Side card={left} label="P1" color="var(--color-lime)" from={-120} winner={stage >= 2 && winner === left} />

      <div className="order-last overflow-hidden rounded-3xl border border-line bg-white xl:order-none">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <span className="font-display text-3xl font-bold tabular-nums">{stage >= 1 ? <CountUp to={left.overall} /> : "––"}</span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-mute">
            <Decode text="Versus" />
          </span>
          <span className="font-display text-3xl font-bold tabular-nums">{stage >= 1 ? <CountUp to={right.overall} /> : "––"}</span>
        </div>
        <div className="divide-y divide-line px-6">
          {KEYS.map((k, i) => {
            const show = stage >= 1;
            const d = i * 0.18;
            const lWin = left.stats[k] > right.stats[k];
            const rWin = right.stats[k] > left.stats[k];
            return (
              <motion.div
                key={k}
                className="grid grid-cols-[28px_1fr_52px_1fr_28px] items-center gap-2 py-3"
                initial={{ opacity: 0 }}
                animate={show ? { opacity: 1 } : {}}
                transition={{ delay: d, duration: 0.2 }}
              >
                <span className={`text-right font-mono text-sm tabular-nums ${lWin ? "font-bold" : "text-mute"}`}>{left.stats[k]}</span>
                <div className="-scale-x-100">
                  {show && <SegBar value={left.stats[k]} segments={14} color="var(--color-lime)" delay={d} className="h-2" />}
                </div>
                <span className="text-center font-mono text-[10px] font-bold tracking-[0.12em]">{k}</span>
                <div>{show && <SegBar value={right.stats[k]} segments={14} color="var(--color-orange)" delay={d} className="h-2" />}</div>
                <span className={`font-mono text-sm tabular-nums ${rWin ? "font-bold" : "text-mute"}`}>{right.stats[k]}</span>
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-center border-t border-line py-4 text-ink">
          <StatRadar cards={[left, right]} colors={["#121311", "#c27a12"]} fills={["#d4f53c", "#f5a93a"]} />
        </div>
        <motion.div
          className="flex items-center justify-between gap-4 bg-ink px-6 py-5 text-sheet"
          initial={{ opacity: 0 }}
          animate={stage >= 2 ? { opacity: 1 } : {}}
        >
          <div>
            <div className="font-display text-xl font-semibold">{verdict}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Stats won {lw} – {rw}</div>
          </div>
          <button onClick={() => setRun((r) => r + 1)} className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-ink">
              ↻ Replay
            </button>
        </motion.div>
      </div>

      <Side card={right} label="P2" color="var(--color-orange)" from={120} winner={stage >= 2 && winner === right} />
    </div>
  );
}
