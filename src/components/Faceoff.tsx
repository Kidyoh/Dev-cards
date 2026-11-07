"use client";

import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { STAT_LABELS, type CardData, type StatKey } from "@/lib/types";
import { DevCard } from "./DevCard";
import { Burst } from "./fx/Burst";
import { CountUp } from "./fx/CountUp";
import { StatRadar } from "./StatPanel";

const KEYS = Object.keys(STAT_LABELS) as StatKey[];

export function Faceoff({ left, right }: { left: CardData; right: CardData }) {
  const reduce = useReducedMotion();
  const shake = useAnimationControls();
  const [stage, setStage] = useState(0); // 0 fly-in, 1 clash, 2 stats, 3 verdict
  const [fire, setFire] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce) {
      setStage(3);
      return;
    }
    setStage(0);
    const t1 = setTimeout(async () => {
      setStage(1);
      setFire((f) => f + 1);
      shake.start({ x: [0, -14, 12, -8, 6, -3, 0], y: [0, 6, -5, 3, -2, 0], transition: { duration: 0.5 } });
    }, 650);
    const t2 = setTimeout(() => setStage(2), 1200);
    const t3 = setTimeout(() => setStage(3), 1200 + KEYS.length * 220 + 500);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [run, reduce, shake]);

  const lw = KEYS.filter((k) => left.stats[k] > right.stats[k]).length;
  const rw = KEYS.filter((k) => right.stats[k] > left.stats[k]).length;
  const winner = left.overall === right.overall ? (lw === rw ? null : lw > rw ? left : right) : left.overall > right.overall ? left : right;
  const verdict = !winner
    ? "Dead even."
    : left.overall === right.overall
      ? `Same overall, but ${winner.name} wins more stats.`
      : `${winner.name} takes it by ${Math.abs(left.overall - right.overall)}.`;

  return (
    <motion.div animate={shake} className="faceoff">
      <div className="vs">
        <motion.div
          key={`l-${run}`}
          initial={{ x: -500, rotate: -25, opacity: 0 }}
          animate={{ x: 0, rotate: stage >= 3 && winner === left ? -2 : 0, opacity: 1, scale: stage >= 3 && winner && winner !== left ? 0.92 : 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className={stage >= 3 && winner === left ? "is-winner" : ""}
        >
          <Link href={`/u/${left.login}`}><DevCard card={left} scale={0.85} flippable={false} idle /></Link>
        </motion.div>

        <div className="vs-mid">
          <div style={{ position: "relative" }}>
            <Burst fire={fire} colors={["#f5c84b", "#6c8bff", "#fff"]} count={90} className="vs-burst" />
            <motion.div
              key={`vs-${run}`}
              className="vs-badge"
              initial={{ scale: 4, opacity: 0, rotate: -20 }}
              animate={stage >= 1 ? { scale: 1, opacity: 1, rotate: 0 } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
            >
              VS
            </motion.div>
          </div>

          <div className="panel cmp-panel">
            <div className="cmp-row" style={{ fontSize: 22, fontWeight: 900 }}>
              <span className={left.overall > right.overall ? "win" : ""}>{stage >= 2 ? <CountUp to={left.overall} /> : "–"}</span>
              <span />
              <span className="k">OVR</span>
              <span />
              <span className={right.overall > left.overall ? "win" : ""}>{stage >= 2 ? <CountUp to={right.overall} /> : "–"}</span>
            </div>
            {KEYS.map((k, i) => {
              const show = stage >= 2;
              const d = i * 0.22;
              const lWin = left.stats[k] > right.stats[k];
              const rWin = right.stats[k] > left.stats[k];
              return (
                <motion.div
                  key={`${k}-${run}`}
                  className="cmp-row"
                  initial={{ opacity: 0, y: 10 }}
                  animate={show ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: d, duration: 0.35 }}
                >
                  <motion.span className={lWin ? "win" : ""} animate={show && lWin && !reduce ? { scale: [1, 1.5, 1] } : {}} transition={{ delay: d + 0.7 }}>
                    {left.stats[k]}
                  </motion.span>
                  <div className="cmp-bar left">
                    <motion.i style={{ background: "#f5c84b" }} initial={{ width: 0 }} animate={show ? { width: `${left.stats[k]}%` } : {}} transition={{ delay: d, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                  <span className="k">{STAT_LABELS[k]}</span>
                  <div className="cmp-bar">
                    <motion.i style={{ background: "#6c8bff" }} initial={{ width: 0 }} animate={show ? { width: `${right.stats[k]}%` } : {}} transition={{ delay: d, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                  <motion.span className={rWin ? "win" : ""} animate={show && rWin && !reduce ? { scale: [1, 1.5, 1] } : {}} transition={{ delay: d + 0.7 }}>
                    {right.stats[k]}
                  </motion.span>
                </motion.div>
              );
            })}
            <StatRadar cards={[left, right]} />
            <motion.div
              className="verdict"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={stage >= 3 ? { scale: 1, opacity: 1 } : {}}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
            >
              {verdict}
              <div className="muted" style={{ fontSize: 13, fontWeight: 500 }}>Stats won {lw} – {rw}</div>
            </motion.div>
          </div>
          {!reduce && (
            <button className="btn ghost" onClick={() => setRun((r) => r + 1)} style={{ marginTop: 12 }}>↻ Run it back</button>
          )}
        </div>

        <motion.div
          key={`r-${run}`}
          initial={{ x: 500, rotate: 25, opacity: 0 }}
          animate={{ x: 0, rotate: stage >= 3 && winner === right ? 2 : 0, opacity: 1, scale: stage >= 3 && winner && winner !== right ? 0.92 : 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className={stage >= 3 && winner === right ? "is-winner" : ""}
        >
          <Link href={`/u/${right.login}`}><DevCard card={right} scale={0.85} flippable={false} idle /></Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
