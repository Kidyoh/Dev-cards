"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readBinder, removeFromBinder } from "@/lib/binder";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";
import { SearchForm } from "./SearchForm";

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
      <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0 }}>Your binder is empty. Look someone up and hit <b>Add to binder</b>.</p>
        <SearchForm cta="Find a card" />
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
      <div className="actions" style={{ alignItems: "center" }}>
        <span className="muted">{logins.length} card{logins.length === 1 ? "" : "s"} · pick two to compare</span>
        {pick.length === 2 && (
          <Link className="btn" href={`/compare?a=${pick[0]}&b=${pick[1]}`}>Compare {pick[0]} vs {pick[1]}</Link>
        )}
      </div>
      <div className="grid-cards focus-grid">
        <AnimatePresence>
        {sorted.map((l, i) => {
          const c = cards[l];
          return (
            <motion.div
              key={l}
              layout
              className={`bcard ${pick.includes(l) ? "picked" : ""}`}
              initial={{ opacity: 0, y: 40, rotate: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 12, transition: { duration: 0.3 } }}
              transition={{ type: "spring", stiffness: 140, damping: 16, delay: i * 0.05 }}
            >
              {c === undefined && <div className="muted" style={{ height: 300 }}>Loading @{l}…</div>}
              {c === "error" && <div className="muted" style={{ height: 300 }}>Couldn&apos;t load @{l}</div>}
              {typeof c === "object" && (
                <Link href={`/u/${c.login}`}><DevCard card={c} scale={0.7} flippable={false} slab={false} /></Link>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button className={`btn ${pick.includes(l) ? "" : "ghost"}`} style={{ padding: "6px 10px" }} onClick={() => toggle(l)}>
                  {pick.includes(l) ? "✓ Picked" : "Pick"}
                </button>
                <button className="btn ghost" style={{ padding: "6px 10px" }}
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
