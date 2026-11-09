"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Headline, Label } from "@/components/bp";
import { Versus } from "@/components/Versus";
import { fetchCard } from "@/lib/api";
import type { CardData } from "@/lib/types";

export function CompareView() {
  const sp = useSearchParams();
  const a = sp.get("a") ?? "";
  const b = sp.get("b") ?? "";
  const [pair, setPair] = useState<[CardData, CardData] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPair(null);
    setError(null);
    if (!a || !b) return;
    setLoading(true);
    Promise.all([fetchCard(a), fetchCard(b)])
      .then((p) => setPair(p))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Couldn't load those cards"))
      .finally(() => setLoading(false));
  }, [a, b]);

  const field = "min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-[12px] outline-none placeholder:text-blue/40";
  return (
    <section className="px-4 pt-6 sm:px-6">
      <Label className="text-blue/60">Procedure · comparison</Label>
      <Headline className="mt-2 text-[clamp(44px,6.4vw,92px)]">Subject A<br />vs subject B.</Headline>
      <form action="/compare" className="mt-6 flex max-w-[620px] flex-wrap border border-blue bg-white sm:flex-nowrap">
        <span className="grid place-items-center border-r border-blue bg-blue px-2 font-mono text-[10px] font-semibold text-white">A</span>
        <input key={`a-${a}`} name="a" defaultValue={a} placeholder="username" aria-label="First username" className={field} />
        <span className="grid place-items-center border-x border-blue bg-blue px-2 font-mono text-[10px] font-semibold text-white">B</span>
        <input key={`b-${b}`} name="b" defaultValue={b} placeholder="username" aria-label="Second username" className={field} />
        <button className="w-full bg-blue px-4 py-1.5 font-mono text-[11px] font-semibold uppercase text-white hover:bg-blue-deep sm:w-auto">Compare →</button>
      </form>
      {loading && (
        <p className="mt-6 font-mono text-[11px] uppercase text-blue">
          Scanning both subjects <span className="animate-blink">▮</span>
        </p>
      )}
      {error && <div className="mt-6 max-w-[620px] border border-blue bg-white p-3 font-mono text-[12px] text-blue">{error}</div>}
      {pair && <Versus left={pair[0]} right={pair[1]} />}
    </section>
  );
}
