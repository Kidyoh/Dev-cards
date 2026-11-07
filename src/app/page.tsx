import Link from "next/link";
import { DevCard } from "@/components/DevCard";
import { Glow } from "@/components/fx/Glow";
import { Reveal, WordsIn } from "@/components/fx/Reveal";
import { HeroFan } from "@/components/HeroFan";
import { Marquee } from "@/components/Marquee";
import { TypingSearch } from "@/components/TypingSearch";
import { getCard } from "@/lib/cards";
import { sampleCard } from "@/lib/sample";
import { STAT_HINTS, STAT_LABELS, type Rarity, type StatKey } from "@/lib/types";

const FEATURED = ["sindresorhus", "gaearon", "torvalds", "yyx990803", "tj", "kentcdodds", "addyosmani", "antfu", "mitchellh", "rauchg"];

export const revalidate = 21600;

const STAT_ICON: Record<StatKey, string> = { SHP: "🚀", CON: "🔥", RNG: "🧭", DEP: "🏛️", IMP: "⭐", COL: "🤝" };
const RARITIES: { r: Rarity; label: string; range: string }[] = [
  { r: "bronze", label: "Bronze", range: "under 58" },
  { r: "silver", label: "Silver", range: "58–71" },
  { r: "gold", label: "Gold", range: "72–84" },
  { r: "legacy", label: "Legacy", range: "85+ · graded slab" },
];

export default async function Home() {
  const featured = (await Promise.allSettled(FEATURED.map((u) => getCard(u))))
    .flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const fan = featured.slice(0, 3);
  const half = Math.ceil(featured.length / 2);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <Reveal><span className="eyebrow"><i /> Series 01 is live</span></Reveal>
          <h1 className="hero-title">
            <WordsIn text="Your GitHub," />
            <br />
            <span className="shimmer-text"><WordsIn text="as a collectible card." delay={0.25} /></span>
          </h1>
          <Reveal delay={0.5}>
            <p className="hero-sub">
              Rip open a pack and pull a card with real stats from your commits, languages and shipped projects.
              Your best repos become moves. Then screenshot it, battle your friends, and climb your country&apos;s leaderboard.
            </p>
          </Reveal>
          <Reveal delay={0.65}>
            <TypingSearch />
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>No sign-in · public GitHub data only</p>
          </Reveal>
        </div>
        <HeroFan cards={fan} />
      </section>

      {featured.length > 3 && (
        <section className="full-bleed">
          <Marquee cards={featured.slice(0, half)} />
          <Marquee cards={featured.slice(half)} reverse />
        </section>
      )}

      <Reveal><h2 className="section-title">Six stats. All earned.</h2></Reveal>
      <div className="stat-grid">
        {(Object.keys(STAT_LABELS) as StatKey[]).map((k, i) => (
          <Reveal key={k} delay={i * 0.06}>
            <Glow className="stat-tile">
              <div className="stat-ico" aria-hidden>{STAT_ICON[k]}</div>
              <b>{k}</b> <span className="stat-name">{STAT_LABELS[k]}</span>
              <p>{STAT_HINTS[k]}</p>
            </Glow>
          </Reveal>
        ))}
      </div>

      <Reveal><h2 className="section-title">Pull rates</h2></Reveal>
      <p className="muted center" style={{ marginTop: -8 }}>Hover a card. Legacy pulls come sealed in a graded slab.</p>
      <div className="rarity-row">
        {RARITIES.map(({ r, label, range }, i) => (
          <Reveal key={r} delay={i * 0.1} className="rarity-item">
            <DevCard card={sampleCard(r)} scale={r === "legacy" ? 0.6 : 0.68} flippable={false} />
            <div className={`pill ${r}`}>{label}</div>
            <div className="muted" style={{ fontSize: 13 }}>{range}</div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <Glow className="cta-panel">
          <h2>Battle a friend</h2>
          <p className="muted">Put two cards head to head and watch the stats collide.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn btn-shine" href="/compare">Start a faceoff</Link>
            <Link className="btn ghost" href="/leaderboard">See leaderboards</Link>
          </div>
        </Glow>
      </Reveal>
    </>
  );
}
