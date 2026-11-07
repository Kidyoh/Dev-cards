import Link from "next/link";
import { DevCard } from "@/components/DevCard";
import { SearchForm } from "@/components/SearchForm";
import { getCard } from "@/lib/cards";
import { STAT_HINTS, STAT_LABELS, type StatKey } from "@/lib/types";

const FEATURED = ["sindresorhus", "gaearon", "torvalds"];

export const revalidate = 21600;

export default async function Home() {
  const featured = (await Promise.allSettled(FEATURED.map((u) => getCard(u))))
    .flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));

  return (
    <>
      <section className="hero">
        <div>
          <h1>Your GitHub,<br />as a collectible card.</h1>
          <p className="muted" style={{ fontSize: 18, maxWidth: 520 }}>
            Type a username and get a card with an overall rating and six stats, all computed from real
            commits, languages and shipped projects. Your best repos become moves. Screenshot it, compare
            cards with friends, and climb the leaderboard for your country or stack.
          </p>
          <SearchForm />
          <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            No sign-in. Only public GitHub data is used.
          </p>
        </div>
        <div className="hero-cards" aria-hidden={featured.length === 0}>
          {featured.map((c, i) => (
            <div
              key={c.login}
              style={{
                left: `${i * 22}%`,
                top: i === 1 ? 0 : 30,
                transform: `rotate(${(i - 1) * 7}deg)`,
                zIndex: i === 1 ? 2 : 1,
              }}
            >
              <Link href={`/u/${c.login}`} aria-label={`${c.name}'s card`}>
                <DevCard card={c} scale={0.72} flippable={false} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <h2>What the stats mean</h2>
      <div className="facts">
        {(Object.keys(STAT_LABELS) as StatKey[]).map((k) => (
          <div className="fact" key={k}>
            <b>{k} <span style={{ fontSize: 14, color: "var(--text)" }}>{STAT_LABELS[k]}</span></b>
            <span>{STAT_HINTS[k]}</span>
          </div>
        ))}
      </div>

      <h2>Rarity</h2>
      <p className="muted">
        <span className="pill bronze">Bronze</span> under 58 · <span className="pill silver">Silver</span> 58–71 ·{" "}
        <span className="pill gold">Gold</span> 72–84 · <span className="pill legacy">Legacy</span> 85+, which
        comes in a graded slab.
      </p>
    </>
  );
}
