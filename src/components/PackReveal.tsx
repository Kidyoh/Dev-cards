"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CardData, Rarity } from "@/lib/types";
import { DevCard } from "./DevCard";
import { Burst } from "./fx/Burst";

const GLOW: Record<Rarity, string> = {
  bronze: "#e09a5a",
  silver: "#dfe8f5",
  gold: "#ffd34d",
  legacy: "#fff4cf",
};

const CONFETTI: Record<Rarity, string[]> = {
  bronze: ["#d9a066", "#8a5a2b", "#f3c79a"],
  silver: ["#ffffff", "#c9d2de", "#8d97a4"],
  gold: ["#ffe58a", "#f5c84b", "#fff", "#b4861a"],
  legacy: ["#ffffff", "#f6e7b8", "#d9b55c", "#ff7ab8", "#6c8bff", "#5fe3c0"],
};

const COUNT: Record<Rarity, number> = { bronze: 40, silver: 70, gold: 120, legacy: 200 };

const CALLOUT: Record<Rarity, string> = {
  bronze: "Bronze",
  silver: "Silver pull",
  gold: "Gold pull!",
  legacy: "LEGACY PULL!!",
};

type Phase = "sealed" | "shaking" | "torn" | "revealed";

export function PackReveal({ card }: { card: CardData }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("sealed");
  const [fire, setFire] = useState(0);
  const [run, setRun] = useState(0);
  const pack = useAnimationControls();
  const started = useRef(false);
  const isSlab = card.rarity === "legacy";
  const w = isSlab ? 340 : 300;
  const h = isSlab ? 530 : 420;

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Timers drive the sequence (not animation promises), so an interrupted animation can never
  // leave the pack stuck half-open.
  const open = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setPhase("shaking");
    pack.start({
      x: [0, -4, 5, -7, 8, -10, 10, -12, 12, -6, 0],
      rotate: [0, -1, 1.5, -2, 2, -3, 3, -3, 3, -1, 0],
      scale: [1, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.06, 1.07, 1.08, 1.08],
      transition: { duration: 0.9, ease: "easeIn" },
    });
    timers.current.push(
      setTimeout(() => {
        setPhase("torn");
        setFire((f) => f + 1);
      }, 900),
      setTimeout(() => setPhase("revealed"), 1280),
    );
  }, [pack]);

  // Skip straight to the card when the viewer prefers reduced motion.
  useEffect(() => {
    if (reduce) {
      started.current = true;
      setPhase("revealed");
    }
  }, [reduce]);

  // Auto-open if nobody taps the pack.
  useEffect(() => {
    if (phase !== "sealed" || reduce) return;
    const t = setTimeout(open, 1600);
    return () => clearTimeout(t);
  }, [phase, open, reduce, run]);

  const replay = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    started.current = false;
    pack.set({ x: 0, rotate: 0, scale: 1 });
    setPhase("sealed");
    setRun((r) => r + 1);
  };

  const glow = GLOW[card.rarity];
  const big = card.rarity === "gold" || card.rarity === "legacy";

  return (
    <div className="pack-stage" style={{ width: w + 120, height: h + 120 }}>
      {/* light rays behind everything once the pack is open */}
      <AnimatePresence>
        {(phase === "torn" || phase === "revealed") && (
          <motion.div
            key={`rays-${run}`}
            className="pack-rays"
            style={{ ["--ray" as string]: glow }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: big ? 0.9 : 0.5, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>

      <Burst fire={fire} colors={CONFETTI[card.rarity]} count={COUNT[card.rarity]} spread={big ? 1.3 : 1} className="pack-burst" />

      <AnimatePresence mode="wait">
        {phase !== "revealed" ? (
          <motion.div
            key={`pack-${run}`}
            className="pack-enter"
            initial={{ y: 40, opacity: 0, rotateX: 20 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: 160, opacity: 0, rotate: 8, transition: { duration: 0.5, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          >
            <motion.button
              type="button"
              className={`pack ${phase !== "sealed" ? "is-opening" : ""}`}
              style={{ width: w, height: h, ["--leak" as string]: glow }}
              animate={pack}
              onClick={open}
              aria-label="Open the pack"
            >
              <div className="pack-inner">
                <motion.div
                  className="pack-top"
                  animate={phase === "torn" ? { y: -220, x: 60, rotate: -28, opacity: 0 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
                >
                  <span>DEV CARDS · SERIES 01</span>
                </motion.div>
                <div className="pack-body">
                  <div className="pack-foil" />
                  <div className="pack-logo">
                    DEV<span>CARDS</span>
                  </div>
                  <div className="pack-sub">1 card · @{card.login}</div>
                  <div className="pack-cta">{phase === "sealed" ? "Tap to rip it open" : "…"}</div>
                </div>
                <div className="pack-seam" />
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key={`card-${run}`}
            className="pack-card"
            initial={{ y: 120, scale: 0.4, rotateY: -540, opacity: 0 }}
            animate={{ y: 0, scale: 1, rotateY: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 70, damping: 13, mass: 0.9 }}
          >
            <DevCard card={card} idle countUp />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "torn" && <motion.div key="flash" className="pack-flash" style={{ ["--leak" as string]: glow }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} />}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "revealed" && !reduce && (
          <motion.div
            key={`callout-${run}`}
            className={`pack-callout ${card.rarity}`}
            initial={{ scale: 3, opacity: 0, rotate: -8 }}
            animate={{ scale: [3, 0.9, 1], opacity: [0, 1, 1, 0], rotate: [-8, 3, 0] }}
            transition={{ duration: 2.2, times: [0, 0.2, 0.3, 1], ease: "easeOut" }}
          >
            {CALLOUT[card.rarity]}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "revealed" && !reduce && (
        <button type="button" className="pack-replay" onClick={replay}>↻ Rip another</button>
      )}
    </div>
  );
}
