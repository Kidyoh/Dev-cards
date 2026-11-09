"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { readBinder, removeFromBinder } from "@/lib/binder";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";
import { ScanInput } from "./ScanInput";

export function Binder() {
  const [logins, setLogins] = useState<string[] | null>(null);
  const [cards, setCards] = useState<Record<string, CardData | "error">>({});
  const [pick, setPick] = useState<string[]>([]);

  useEffect(() => setLogins(readBinder()), []);

  useEffect(() => {
    if (!logins) return;
    for (const l of logins) {
      if (cards[l]) continue;
      fetch(`${API}/api/card/${encodeURIComponent(l)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((c: CardData) => setCards((m) => ({ ...m, [l]: c })))
        .catch(() => setCards((m) => ({ ...m, [l]: "error" })));
    }
  }, [logins]); // eslint-disable-line react-hooks/exhaustive-deps

  if (logins === null) return null;
  if (logins.length === 0) {
    return (
      <div className="mt-8 flex max-w-md flex-col gap-3 border border-dashed border-blue p-4">
        <p className="font-mono text-[11px] uppercase text-blue">Binder empty. Scan someone and hit + Binder.</p>
        <ScanInput />
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
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-blue/40 py-2">
        <span className="font-mono text-[10.5px] uppercase text-blue">
          {logins.length} card{logins.length === 1 ? "" : "s"} · pick two to compare
        </span>
        {pick.length === 2 && (
          <Link className="bg-blue px-2 py-1 font-mono text-[11px] font-semibold uppercase text-white" href={`/compare?a=${pick[0]}&b=${pick[1]}`}>
            Compare {pick[0]} vs {pick[1]} →
          </Link>
        )}
      </div>
      <div className="focus-grid mt-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] justify-items-center gap-8">
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
              {c === undefined && <div className="grid h-[294px] w-[210px] place-items-center border border-dashed border-blue font-mono text-[10px] uppercase text-blue">Scanning @{l}</div>}
              {c === "error" && <div className="grid h-[294px] w-[210px] place-items-center border border-dashed border-blue font-mono text-[10px] uppercase text-blue">Couldn&apos;t load @{l}</div>}
              {typeof c === "object" && (
                <Link href={`/u/${c.login}`}><DevCard card={c} scale={0.7} flippable={false} slab={false} /></Link>
              )}
              <div className="flex gap-1.5 font-mono text-[10.5px] uppercase">
                <button className={`border border-blue px-2 py-0.5 ${pick.includes(l) ? "bg-blue text-white" : "bg-white text-blue"}`} onClick={() => toggle(l)}>
                  {pick.includes(l) ? "✓ Picked" : "Pick"}
                </button>
                <button className="border border-blue bg-white px-2 py-0.5 text-blue hover:bg-blue hover:text-white"
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
