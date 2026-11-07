"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readBinder, removeFromBinder } from "@/lib/binder";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";
import { ScanForm } from "./ScanForm";

export function Binder() {
  const [logins, setLogins] = useState<string[] | null>(null);
  const [cards, setCards] = useState<Record<string, CardData | "error">>({});
  const [pick, setPick] = useState<string[]>([]);

  useEffect(() => setLogins(readBinder()), []);

  useEffect(() => {
    if (!logins) return;
    for (const l of logins) {
      if (cards[l]) continue;
      fetch(`/api/card/${encodeURIComponent(l)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((c: CardData) => setCards((m) => ({ ...m, [l]: c })))
        .catch(() => setCards((m) => ({ ...m, [l]: "error" })));
    }
  }, [logins]); // eslint-disable-line react-hooks/exhaustive-deps

  if (logins === null) return null;
  if (logins.length === 0) {
    return (
      <div className="mt-10 flex flex-col gap-5 rounded-3xl border border-dashed border-ink/25 p-8">
        <p className="text-lg">Your binder is empty. Look someone up and hit <b>Add to binder</b>.</p>
        <ScanForm tone="light" cta="Find a card" />
      </div>
    );
  }

  const toggle = (l: string) =>
    setPick((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p.slice(-1), l]));

  const sorted = [...logins].sort((a, b) => {
    const ca = cards[a], cb = cards[b];
    return (typeof cb === "object" ? cb.overall : -1) - (typeof ca === "object" ? ca.overall : -1);
  });

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
          {logins.length} card{logins.length === 1 ? "" : "s"} · pick two to compare
        </span>
        {pick.length === 2 && (
          <Link className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-lime" href={`/compare?a=${pick[0]}&b=${pick[1]}`}>
            Compare {pick[0]} vs {pick[1]} →
          </Link>
        )}
      </div>
      <div className="focus-grid mt-10 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] justify-items-center gap-8">
        <AnimatePresence>
        {sorted.map((l, i) => {
          const c = cards[l];
          return (
            <motion.div
              key={l}
              layout
              className={`bcard flex flex-col items-center gap-3 transition-[filter] duration-300 ${pick.includes(l) ? "picked" : ""}`}
              initial={{ opacity: 0, y: 40, rotate: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 12, transition: { duration: 0.3 } }}
              transition={{ type: "spring", stiffness: 140, damping: 16, delay: i * 0.05 }}
            >
              {c === undefined && <div className="grid h-[294px] w-[210px] place-items-center rounded-2xl border border-dashed border-ink/20 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Scanning @{l}</div>}
              {c === "error" && <div className="grid h-[294px] w-[210px] place-items-center rounded-2xl border border-dashed border-ink/20 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Couldn&apos;t load @{l}</div>}
              {typeof c === "object" && (
                <Link href={`/u/${c.login}`}><DevCard card={c} scale={0.7} flippable={false} slab={false} /></Link>
              )}
              <div className="flex gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
                <button className={`rounded-full border px-3 py-1.5 ${pick.includes(l) ? "border-ink bg-ink text-lime" : "border-ink/20 bg-white"}`} onClick={() => toggle(l)}>
                  {pick.includes(l) ? "✓ Picked" : "Pick"}
                </button>
                <button className="rounded-full border border-ink/20 bg-white px-3 py-1.5 hover:border-ink"
                  onClick={() => { removeFromBinder(l); setLogins((x) => x?.filter((y) => y !== l) ?? []); setPick((p) => p.filter((y) => y !== l)); }}>
                  Remove
                </button>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </>
  );
}
