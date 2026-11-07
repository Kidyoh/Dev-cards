"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { PixelatedCanvas } from "@/components/ui/pixelated-canvas";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";
import { Barcode, Decode } from "./hud";

/**
 * Hero subject: a featured card rendered as an interactive dot matrix (Aceternity PixelatedCanvas)
 * with HUD callouts. "Change view" swaps between the dot scan and the live 3D card.
 */
export function HeroScan({ card }: { card: CardData }) {
  const [view, setView] = useState<"scan" | "card">("scan");
  const isSlab = card.rarity === "legacy";
  const W = isSlab ? 340 : 300;
  const H = isSlab ? 530 : 420;
  const S = 0.92;

  const tags = [
    { top: "8%", left: "-6%", k: "OVR", v: `${card.overall} / ${card.rarity}` },
    { top: "36%", right: "-10%", k: "Subject", v: `@${card.login}` },
    { top: "62%", left: "-12%", k: "Top move", v: card.moves[0]?.name ?? "—" },
    { top: "86%", right: "-4%", k: "Type", v: card.element.name },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-[520px] flex-col items-center">
      <button
        type="button"
        onClick={() => setView((v) => (v === "scan" ? "card" : "scan"))}
        className="mb-6 rounded-sm border border-white/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-ink"
      >
        Change view · {view === "scan" ? "Card" : "Scan"}
      </button>

      <div className="relative" style={{ width: W * S, height: H * S }}>
        {/* corner brackets */}
        {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-b border-l", "right-0 bottom-0 border-b border-r"].map((c) => (
          <span key={c} className={`absolute -m-4 size-4 border-white/50 ${c}`} aria-hidden />
        ))}

        <AnimatePresence mode="wait">
          {view === "scan" ? (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <PixelatedCanvas
                src={`/api/card/${card.login}/image?format=card`}
                width={Math.round(W * S)}
                height={Math.round(H * S)}
                cellSize={4}
                dotScale={0.92}
                shape="square"
                backgroundColor="#121311"
                objectFit="contain"
                dropoutStrength={0}
                interactive
                distortionMode="repel"
                distortionStrength={6}
                distortionRadius={90}
                followSpeed={0.18}
                jitterStrength={0.6}
                jitterSpeed={2}
                sampleAverage
                tintColor="#d4f53c"
                tintStrength={0.06}
                fadeOnLeave
              />
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/u/${card.login}`}>
                <DevCard card={card} scale={S} flippable={false} idle />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD tags */}
        {tags.map((t, i) => (
          <motion.div
            key={t.k}
            className="pointer-events-none absolute hidden font-mono uppercase sm:block"
            style={{ top: t.top, left: t.left, right: t.right }}
            initial={{ opacity: 0, x: t.left ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.15 }}
          >
            <div className="flex items-center gap-2">
              {t.right && <span className="h-px w-8 bg-white/50" />}
              <span className="rounded-sm border border-white/30 bg-ink/80 px-1.5 py-1 backdrop-blur-sm">
                <span className="block text-[8.5px] tracking-[0.22em] text-white/50">{t.k}</span>
                <span className="block text-[10.5px] font-bold tracking-[0.06em] text-lime">
                  <Decode text={t.v} />
                </span>
              </span>
              {t.left && <span className="h-px w-8 bg-white/50" />}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex w-full items-center justify-between gap-4 font-mono text-[9.5px] uppercase tracking-[0.2em] text-white/45" style={{ maxWidth: W * S + 32 }}>
        <span>{view === "scan" ? "Hover to disturb the scan" : "Tap the card to open it"}</span>
        <Barcode value={card.login} className="h-4 text-white/60" />
      </div>
    </div>
  );
}
