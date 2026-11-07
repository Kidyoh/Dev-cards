import type { Metadata } from "next";
import Link from "next/link";
import { ErrorBox } from "@/components/ErrorBox";
import { COUNTRIES, getBoard, STACKS, type Board } from "@/lib/cards";
import type { CardData } from "@/lib/types";

export const metadata: Metadata = { title: "Leaderboards" };

type Props = { searchParams: Promise<{ country?: string; stack?: string }> };

export default async function LeaderboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const board: Board = sp.stack
    ? { kind: "stack", value: sp.stack }
    : { kind: "country", value: sp.country ?? "Nigeria" };

  let cards: CardData[] = [];
  let error: unknown = null;
  try {
    cards = await getBoard(board);
  } catch (e) {
    error = e;
  }

  return (
    <>
      <h1>Leaderboards</h1>
      <p className="muted">
        Ranks the 15 most-followed developers in a country or stack by card overall. Rankings refresh every 6 hours.
      </p>

      <h2>By country</h2>
      <div className="chips">
        {COUNTRIES.map((c) => (
          <Link key={c} href={`/leaderboard?country=${encodeURIComponent(c)}`}
            className={`chip ${board.kind === "country" && board.value.toLowerCase() === c.toLowerCase() ? "active" : ""}`}>
            {c}
          </Link>
        ))}
      </div>
      <h2>By stack</h2>
      <div className="chips">
        {STACKS.map((s) => (
          <Link key={s} href={`/leaderboard?stack=${encodeURIComponent(s)}`}
            className={`chip ${board.kind === "stack" && board.value.toLowerCase() === s.toLowerCase() ? "active" : ""}`}>
            {s}
          </Link>
        ))}
      </div>

      <h2>{board.kind === "country" ? "Top developers in " : "Top "}{board.value}{board.kind === "stack" ? " developers" : ""}</h2>
      {error ? (
        <ErrorBox error={error} />
      ) : cards.length === 0 ? (
        <p className="muted">Nobody here yet.</p>
      ) : (
        <div className="panel lb-wrap">
          <table className="lb">
            <thead>
              <tr>
                <th>#</th><th>Developer</th><th>Tier</th><th className="num">OVR</th>
                <th className="num">SHP</th><th className="num">CON</th><th className="num">RNG</th>
                <th className="num">DEP</th><th className="num">IMP</th><th className="num">COL</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c, i) => (
                <tr key={c.login}>
                  <td>{i + 1}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.avatarUrl} alt="" />
                    <Link href={`/u/${c.login}`}>{c.name}</Link>
                  </td>
                  <td><span className={`pill ${c.rarity}`}>{c.rarity}</span></td>
                  <td className="num"><b>{c.overall}</b></td>
                  <td className="num">{c.stats.SHP}</td><td className="num">{c.stats.CON}</td>
                  <td className="num">{c.stats.RNG}</td><td className="num">{c.stats.DEP}</td>
                  <td className="num">{c.stats.IMP}</td><td className="num">{c.stats.COL}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
