import type { Metadata } from "next";
import Link from "next/link";
import { DevCard } from "@/components/DevCard";
import { ErrorBox } from "@/components/ErrorBox";
import { getCard } from "@/lib/cards";
import { STAT_LABELS, type CardData, type StatKey } from "@/lib/types";

export const metadata: Metadata = { title: "Compare" };

type Props = { searchParams: Promise<{ a?: string; b?: string }> };

function Picker({ a, b }: { a?: string; b?: string }) {
  return (
    <form action="/compare" className="search" style={{ maxWidth: 640 }}>
      <input name="a" defaultValue={a} placeholder="First username" aria-label="First username" className="input" />
      <input name="b" defaultValue={b} placeholder="Second username" aria-label="Second username" className="input" />
      <button className="btn">Face off</button>
    </form>
  );
}

export default async function ComparePage({ searchParams }: Props) {
  const { a, b } = await searchParams;
  if (!a || !b) {
    return (
      <>
        <h1>Head to head</h1>
        <p className="muted">Put two developers side by side, stat by stat.</p>
        <Picker a={a} b={b} />
      </>
    );
  }

  let left: CardData, right: CardData;
  try {
    [left, right] = await Promise.all([getCard(a), getCard(b)]);
  } catch (e) {
    return (
      <>
        <h1>Head to head</h1>
        <Picker a={a} b={b} />
        <div style={{ marginTop: 16 }}><ErrorBox error={e} /></div>
      </>
    );
  }

  const keys = Object.keys(STAT_LABELS) as StatKey[];
  const lw = keys.filter((k) => left.stats[k] > right.stats[k]).length;
  const rw = keys.filter((k) => right.stats[k] > left.stats[k]).length;
  const verdict =
    left.overall === right.overall
      ? lw === rw ? "Dead even." : `Same overall, but ${lw > rw ? left.name : right.name} wins more stats.`
      : `${left.overall > right.overall ? left.name : right.name} takes it by ${Math.abs(left.overall - right.overall)}.`;

  return (
    <>
      <h1>Head to head</h1>
      <Picker a={a} b={b} />
      <h2>{verdict}</h2>
      <div className="vs">
        <Link href={`/u/${left.login}`}><DevCard card={left} scale={0.85} flippable={false} /></Link>
        <div className="panel" style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
          <div className="cmp-row" style={{ fontSize: 22, fontWeight: 900 }}>
            <span className={left.overall > right.overall ? "win" : ""}>{left.overall}</span>
            <span />
            <span className="k">OVR</span>
            <span />
            <span className={right.overall > left.overall ? "win" : ""}>{right.overall}</span>
          </div>
          {keys.map((k) => (
            <div key={k} className="cmp-row">
              <span className={left.stats[k] > right.stats[k] ? "win" : ""}>{left.stats[k]}</span>
              <div className="cmp-bar left"><i style={{ width: `${left.stats[k]}%`, background: "#f5c84b" }} /></div>
              <span className="k">{STAT_LABELS[k]}</span>
              <div className="cmp-bar"><i style={{ width: `${right.stats[k]}%`, background: "#6c8bff" }} /></div>
              <span className={right.stats[k] > left.stats[k] ? "win" : ""}>{right.stats[k]}</span>
            </div>
          ))}
          <p className="muted center" style={{ fontSize: 13 }}>Stats won: {lw} – {rw}</p>
        </div>
        <Link href={`/u/${right.login}`}><DevCard card={right} scale={0.85} flippable={false} /></Link>
      </div>
    </>
  );
}
