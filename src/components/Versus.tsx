"use client";

import Link from "next/link";
import { STAT_LABELS, type CardData, type StatKey } from "@/lib/types";
import { Bracket, Cells, Tag, Win } from "./bp";
import { DevCard } from "./DevCard";

const KEYS = Object.keys(STAT_LABELS) as StatKey[];

export function Versus({ left, right }: { left: CardData; right: CardData }) {
  const lw = KEYS.filter((k) => left.stats[k] > right.stats[k]).length;
  const rw = KEYS.filter((k) => right.stats[k] > left.stats[k]).length;
  const winner = left.overall === right.overall ? (lw === rw ? null : lw > rw ? left : right) : left.overall > right.overall ? left : right;
  const verdict = !winner ? "Dead even." : left.overall === right.overall ? `${winner.name} edges it on stats.` : `${winner.name} takes it by ${Math.abs(left.overall - right.overall)}.`;

  const side = (c: CardData, label: string) => (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[300px] items-center justify-between">
        <Tag>{label}</Tag>
        <span className="font-mono text-[10px] uppercase text-blue">@{c.login}{winner === c ? " · winner" : ""}</span>
      </div>
      <Link href={`/u/${c.login}`}>
        <DevCard card={c} scale={0.85} flippable={false} idle />
      </Link>
    </div>
  );

  return (
    <div className="mt-10 grid items-start gap-8 xl:grid-cols-[1fr_420px_1fr]">
      {side(left, "Subject A")}
      <div className="order-last xl:order-none">
        <Win title="Comparison · 06 stats" delay={100}>
          <div className="flex items-baseline justify-between border-b border-blue/30 pb-2">
            <span className="font-serif text-4xl font-light text-blue">{left.overall}</span>
            <span className="font-mono text-[10px] uppercase text-blue">Overall</span>
            <span className="font-serif text-4xl font-light text-blue">{right.overall}</span>
          </div>
          <div className="mt-1">
            {KEYS.map((k, i) => (
              <div key={k} className="grid grid-cols-[26px_1fr_40px_1fr_26px] items-center gap-2 border-b border-blue/20 py-2 last:border-0">
                <span className={`text-right font-mono text-[11px] text-blue ${left.stats[k] > right.stats[k] ? "font-semibold" : "opacity-60"}`}>{left.stats[k]}</span>
                <div className="-scale-x-100"><Cells value={left.stats[k]} count={12} className="h-2.5" delay={i * 0.1} /></div>
                <span className="text-center font-mono text-[9.5px] font-semibold text-blue">{k}</span>
                <Cells value={right.stats[k]} count={12} className="h-2.5" delay={i * 0.1} />
                <span className={`font-mono text-[11px] text-blue ${right.stats[k] > left.stats[k] ? "font-semibold" : "opacity-60"}`}>{right.stats[k]}</span>
              </div>
            ))}
          </div>
        </Win>
        <div className="mt-3 border border-blue bg-blue p-3 text-white">
          <div className="font-mono text-[9px] uppercase opacity-80">Verdict</div>
          <div className="font-serif text-2xl font-light uppercase">{verdict}</div>
          <div className="font-mono text-[9.5px] uppercase opacity-80">Stats won {lw} – {rw}</div>
        </div>
        <Bracket className="mt-3">A · {left.role.name} &nbsp;/&nbsp; B · {right.role.name}</Bracket>
      </div>
      {side(right, "Subject B")}
    </div>
  );
}
