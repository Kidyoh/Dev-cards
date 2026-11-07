import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DevCard } from "@/components/DevCard";
import { HeroScan } from "@/components/HeroScan";
import { Barcode, Bracket, Dot, Eyebrow, HudPanel, PixelReveal, SegBar, Sheet } from "@/components/hud";
import { ScanForm } from "@/components/ScanForm";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { getCard } from "@/lib/cards";
import { sampleCard } from "@/lib/sample";
import { STAT_HINTS, STAT_LABELS, type CardData, type Rarity, type StatKey } from "@/lib/types";

const FEATURED = ["sindresorhus", "gaearon", "torvalds", "yyx990803", "tj", "kentcdodds", "addyosmani", "antfu", "mitchellh", "rauchg"];
const RANK: Record<Rarity, number> = { legacy: 3, gold: 2, silver: 1, bronze: 0 };

export const revalidate = 21600;

const SAMPLE_STATS: Record<StatKey, number> = { SHP: 86, CON: 71, RNG: 66, DEP: 82, IMP: 74, COL: 77 };

export default async function Home() {
  const featured = (await Promise.allSettled(FEATURED.map((u) => getCard(u))))
    .flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const hero: CardData = [...featured].sort((a, b) => RANK[b.rarity] - RANK[a.rarity] || b.overall - a.overall)[0] ?? sampleCard("gold");
  const keys = Object.keys(STAT_LABELS) as StatKey[];

  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <Sheet
        tone="dark"
        id="scan"
        inner="pt-14 md:pt-20 pb-10 md:pb-14"
        backdrop={
          <>
            <div className="blueprint-dark absolute inset-0 opacity-60" />
            <DottedGlowBackground
          className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
          gap={14}
          radius={1.4}
          color="rgba(246,246,241,0.55)"
          glowColor="rgba(212,245,60,0.9)"
          opacity={0.6}
          speedMin={0.3}
          speedMax={1.2}
            />
          </>
        }
      >

        <div className="relative flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
          <span>Dev Cards / Series 01</span>
          <span className="hidden sm:block">Scan · Rate · Collect</span>
          <span className="text-right">Local build · v0.3</span>
        </div>

        <div className="relative mt-10 grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80">
              <Dot /> Collectible GitHub cards
            </span>
            <h1 className="mt-6 text-[clamp(52px,7.6vw,100px)] font-bold leading-[0.88]">
              <span className="text-lime">Your code,</span>
              <br />
              <span className="mr-3 align-middle text-[0.32em] font-medium text-white/80">as a</span>
              <span className="text-orange">card.</span>
            </h1>
            <p className="mt-7 max-w-[460px] text-lg leading-relaxed text-white/70">
              We scan your public commits, languages and shipped projects, then print you a rated card. Your best
              repos become moves.
            </p>
            <ScanForm className="mt-8" />
            {featured.length > 0 && (
              <div className="mt-8 flex items-center gap-6">
                <div className="flex pl-4">
                  <AnimatedTooltip
                    items={featured.slice(0, 6).map((c, i) => ({
                      id: i,
                      name: c.name,
                      designation: `${c.overall} OVR · ${c.role.name}`,
                      image: c.avatarUrl,
                    }))}
                  />
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">Already scanned</span>
              </div>
            )}
          </div>
          <HeroScan card={hero} />
        </div>

        {/* readout strip, like a scoreboard */}
        <div className="relative mt-16 grid grid-cols-2 border-t border-white/10 pt-8 sm:grid-cols-4">
          {[
            ["06", "stats", "text-lime"],
            ["04", "rarities", "text-white"],
            ["00", "sign-ins", "text-white"],
            ["∞", "rivals", "text-orange"],
          ].map(([n, l, c], i) => (
            <div key={l} className={`py-2 ${i > 0 ? "sm:border-l sm:border-white/10 sm:pl-8" : ""}`}>
              <div className={`font-display text-5xl font-bold tabular-nums md:text-6xl ${c}`}>{n}</div>
              <div className="mt-1 text-sm text-white/50">{l}</div>
            </div>
          ))}
        </div>
      </Sheet>

      {/* ───────────────────────── HOW IT WORKS ───────────────────────── */}
      <Sheet tone="light" className="blueprint">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <Eyebrow>01 · How it works</Eyebrow>
            <PixelReveal cols={16} rows={5}>
              <h2 className="mt-5 text-[clamp(40px,6vw,76px)] font-bold leading-[0.95]">
                Scan.
                <br />
                Rate. <span className="text-ink/35">Brag.</span>
              </h2>
            </PixelReveal>
            <p className="mt-6 max-w-[440px] text-lg leading-relaxed text-mute">
              No sign-in and no forms. Type a username and the card prints itself from 12 months of public activity.
            </p>
            <ol className="mt-10 divide-y divide-line border-y border-line">
              {[
                ["Scan", "We read commits, PRs, reviews, languages and deployed repos."],
                ["Rate", "Six stats, an overall, a rarity tier and a role."],
                ["Brag", "Share the PNG, compare with a friend, climb your country's board."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[48px_100px_1fr] items-baseline gap-2 py-4">
                  <span className="font-mono text-xs text-mute">0{i + 1}</span>
                  <span className="font-display text-lg font-semibold">{t}</span>
                  <span className="text-sm text-mute">{d}</span>
                </li>
              ))}
            </ol>
            <Link href="/u/torvalds" className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-sheet transition-transform hover:-translate-y-0.5">
              See an example card <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Aceternity 3D card: hover and the stack pops apart in depth */}
          <CardContainer containerClassName="py-0">
            <CardBody className="relative h-[460px] w-[340px] [transform-style:preserve-3d]">
              <CardItem translateZ={20} rotateZ={-8} className="absolute left-[-30px] top-6">
                <DevCard card={sampleCard("silver")} scale={0.82} flippable={false} interactive={false} />
              </CardItem>
              <CardItem translateZ={60} rotateZ={6} className="absolute right-[-40px] top-0">
                <DevCard card={sampleCard("bronze")} scale={0.82} flippable={false} interactive={false} />
              </CardItem>
              <CardItem translateZ={120} className="absolute left-6 top-10">
                <DevCard card={sampleCard("gold")} scale={0.9} flippable={false} interactive={false} />
              </CardItem>
              <CardItem translateZ={160} className="absolute -bottom-6 right-[-60px] w-[200px]">
                <HudPanel title="Readout" meta="03">
                  <div className="space-y-1.5">
                    {(["SHP", "DEP", "COL"] as StatKey[]).map((k) => (
                      <div key={k} className="grid grid-cols-[30px_1fr_20px] items-center gap-2">
                        <span>{k}</span>
                        <SegBar value={SAMPLE_STATS[k]} segments={14} className="h-2" />
                        <span className="text-right font-bold">{SAMPLE_STATS[k]}</span>
                      </div>
                    ))}
                  </div>
                </HudPanel>
              </CardItem>
            </CardBody>
          </CardContainer>
        </div>
      </Sheet>

      {/* ───────────────────────── STATS ───────────────────────── */}
      <Sheet tone="dark" backdrop={<div className="blueprint-dark absolute inset-0" />}>
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div>
            <Eyebrow className="text-white">02 · The readout</Eyebrow>
            <PixelReveal cols={16} rows={4} color="var(--color-ink)">
              <h2 className="mt-5 text-[clamp(40px,6vw,76px)] font-bold leading-[0.95]">
                Six stats.
                <br />
                <span className="text-lime">All earned.</span>
              </h2>
            </PixelReveal>
          </div>
          <Bracket className="text-white/50">Core stats</Bracket>
        </div>
        <div className="relative mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {keys.map((k, i) => (
            <div key={k} className="group rounded-2xl border border-line-dark bg-ink-2 p-6 transition-colors hover:border-lime/60">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                <span>Stat_0{i + 1}</span>
                <span className="text-lime opacity-0 transition-opacity group-hover:opacity-100">● Live</span>
              </div>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-4xl font-bold text-lime">{k}</span>
                <span className="font-display text-xl font-medium">{STAT_LABELS[k]}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{STAT_HINTS[k]}</p>
              <SegBar
                value={SAMPLE_STATS[k]}
                segments={30}
                color="var(--color-lime)"
                track="rgb(246 246 241 / 0.08)"
                delay={i * 0.08}
                className="mt-6"
              />
            </div>
          ))}
        </div>
      </Sheet>

      {/* ───────────────────────── ON THE BOARD ───────────────────────── */}
      <Sheet tone="light" inner="px-0 sm:px-0">
        <div className="px-5 sm:px-8">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <Eyebrow>03 · On the board</Eyebrow>
              <h2 className="mt-5 text-[clamp(40px,6vw,76px)] font-bold leading-[0.95]">Who&apos;s been scanned?</h2>
            </div>
            <p className="text-lg leading-relaxed text-mute md:pb-2">
              Every card is computed live from public data. Tap any of them to see the full readout.
            </p>
          </div>
        </div>
        {featured.length > 0 && (
          <div className="mt-12 flex flex-col items-center">
            <InfiniteMovingCards speed="slow" className="max-w-none">
              {featured.map((c) => (
                <li key={c.login} className="shrink-0 px-2 py-6">
                  <Link href={`/u/${c.login}`} className="block transition-transform hover:-translate-y-2">
                    <DevCard card={c} scale={0.56} flippable={false} slab={false} interactive={false} />
                  </Link>
                </li>
              ))}
            </InfiniteMovingCards>
          </div>
        )}

        <div className="mt-16 grid gap-3 px-5 sm:px-8 md:grid-cols-4">
          {(["bronze", "silver", "gold", "legacy"] as Rarity[]).map((r, i) => (
            <div key={r} className="flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Tier 0{i + 1}</div>
                <div className="font-display text-xl font-semibold capitalize">{r}</div>
              </div>
              <span className="rounded-md bg-ink px-2 py-1 font-mono text-[10px] font-bold uppercase text-lime">
                {["< 58", "58–71", "72–84", "85+"][i]}
              </span>
            </div>
          ))}
        </div>
      </Sheet>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <Sheet tone="dark" inner="py-14 md:py-16">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <Eyebrow className="text-white">04 · Rivalry</Eyebrow>
            <h2 className="mt-4 text-[clamp(32px,4.5vw,56px)] font-bold leading-none">
              Settle it <span className="text-lime">card to card.</span>
            </h2>
            <p className="mt-4 max-w-md text-white/60">Put two developers head to head. The stats decide.</p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex flex-wrap gap-3">
              <Link href="/compare" className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5">
                Start a faceoff <ArrowRight className="size-4" />
              </Link>
              <Link href="/leaderboard" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-white hover:text-ink">
                Leaderboards
              </Link>
            </div>
            <Barcode value="faceoff" className="h-5 text-white/40" />
          </div>
        </div>
      </Sheet>
    </>
  );
}
