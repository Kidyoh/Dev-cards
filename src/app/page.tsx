import Link from "next/link";
import { Axis, Barcode, Bracket, Cells, Headline, Label, Spark, Tag, ThreadRow, VMeters, Win } from "@/components/bp";
import { DevCard } from "@/components/DevCard";
import { PointCloud } from "@/components/PointCloud";
import { ScanInput } from "@/components/ScanInput";
import { getBoard } from "@/lib/cards";
import { sampleCard } from "@/lib/sample";
import { STAT_HINTS, STAT_LABELS, type CardData, type Rarity, type StatKey } from "@/lib/types";

const RANK: Record<Rarity, number> = { legacy: 3, gold: 2, silver: 1, bronze: 0 };
const KEYS: StatKey[] = ["SHP", "CON", "RNG", "DEP", "IMP", "COL"];

export const dynamic = "force-dynamic";

function GridHand() {
  // line drawing for the INSTRUCTION window: a perspective grid and a pointer
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-full text-blue" fill="none" stroke="currentColor" strokeWidth={0.7} aria-hidden>
      {Array.from({ length: 7 }, (_, i) => <line key={`v${i}`} x1={20 + i * 10} y1={10} x2={10 + i * 13} y2={70} />)}
      {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={20 - i * 1.6} y1={10 + i * 10} x2={80 + i * 2.8} y2={10 + i * 10} />)}
      <path d="M86 52 l14 -10 l3 4 l-9 7 l12 4 l-2 5 l-14 -3 z" fill="currentColor" />
      <circle cx="66" cy="34" r="3" />
      <line x1="69" y1="34" x2="104" y2="22" />
      <text x="104" y="20" fontSize="5" fill="currentColor" stroke="none" fontFamily="monospace">1</text>
    </svg>
  );
}

function Chip() {
  return (
    <svg viewBox="0 0 120 34" className="h-9 w-full text-blue" fill="none" stroke="currentColor" strokeWidth={0.8} aria-hidden>
      <rect x="44" y="8" width="18" height="18" />
      <rect x="49" y="13" width="8" height="8" fill="currentColor" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M44 ${11 + i * 4} H${30 - i * 6} V${4 + i * 7}`} />
          <path d={`M62 ${11 + i * 4} H${78 + i * 8}`} />
          <circle cx={80 + i * 8} cy={11 + i * 4} r={1.6} />
        </g>
      ))}
      <circle cx="104" cy="27" r="4" />
      <circle cx="114" cy="27" r="2.5" fill="currentColor" />
    </svg>
  );
}

export default async function Home() {
  // Featured = the top of the Ethiopia board (people already scanned). Nothing is fetched from GitHub here.
  const featured = await getBoard(undefined, 8).catch(() => []);
  const subject: CardData = [...featured].sort((a, b) => RANK[b.rarity] - RANK[a.rarity] || b.overall - a.overall)[0] ?? sampleCard("gold");
  const s = subject.stats;
  const seconds = String(subject.raw.activeDays % 60).padStart(2, "0");

  return (
    <>
      {/* ───────────── HUD hero, laid out like the reference ───────────── */}
      <section id="scan" className="relative px-4 pb-6 sm:px-6 lg:min-h-[930px]">
        <Headline className="relative z-10 mt-6 text-[clamp(44px,6.4vw,92px)] lg:mt-2">
          Your code,
          <br />
          as a card.
        </Headline>

        {/* center subject */}
        <div className="relative mx-auto mt-6 max-w-[760px] lg:absolute lg:inset-x-0 lg:top-[40px] lg:mt-0">
          <PointCloud overall={subject.overall} name={subject.login} className="h-[440px] cursor-crosshair sm:h-[520px] lg:h-[620px]" />
          <Link href={`/u/${subject.login}`} className="absolute right-[14%] top-[22%] hidden sm:block">
            <Tag>@{subject.login}</Tag>
          </Link>
          <div className="absolute left-1/2 top-[6%] hidden -translate-x-1/2 font-mono text-[9px] uppercase text-blue/60 sm:block">
            Subject · {subject.overall} OVR · {subject.rarity}
          </div>
        </div>

        {/* left column */}
        <div className="relative z-10 mt-6 grid gap-6 lg:absolute lg:left-6 lg:top-[250px] lg:mt-0 lg:w-[220px] lg:grid-cols-1">
          <Win title="Instruction" delay={100}>
            <GridHand />
            <div className="mt-1 font-mono text-[10px] uppercase leading-snug text-blue">
              Type a GitHub username
              <br />
              to scan the subject
            </div>
            <div className="mt-2"><ScanInput /></div>
            <div className="mt-3 border-t border-blue/30 pt-2">
              <Label>Chip N°1</Label>
              <Chip />
              <div className="flex justify-between font-mono text-[8.5px] text-blue/70">
                <span>NO SIGN-IN</span>
                <span>PUBLIC DATA ONLY</span>
              </div>
            </div>
          </Win>
        </div>

        {/* right column */}
        <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2 lg:absolute lg:right-6 lg:top-[150px] lg:mt-0 lg:w-[230px] lg:grid-cols-1">
          <Win title="Interactivity" delay={200}>
            <div className="flex justify-between font-mono text-[8.5px] text-blue">
              <span>{String(subject.raw.contributions).padStart(6, "0")}</span>
              <span>—</span>
              <span>{String(subject.raw.followers).padStart(6, "0")}</span>
            </div>
            <Link href={`/u/${subject.login}`} className="relative mt-1 block aspect-[4/3] overflow-hidden border border-blue/40 bg-blue-wash">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={subject.avatarUrl} alt="" className="h-full w-full object-cover opacity-90 grayscale contrast-125" />
              <span className="absolute inset-0 bg-blue mix-blend-screen" />
              <span className="absolute inset-0 [background-image:linear-gradient(rgb(47_63_194/.25)_1px,transparent_1px)] [background-size:100%_3px]" />
            </Link>
            <div className="mt-1 flex justify-between font-mono text-[8.5px] text-blue">
              <span>{subject.login.toUpperCase()}</span>
              <span>{subject.role.name.toUpperCase()}</span>
            </div>
            <div className="mt-2 font-mono text-[8.5px] uppercase text-blue">Strength and intensity</div>
            <Cells value={s.SHP} className="mt-1" />
            <div className="mt-0.5 flex justify-between font-mono text-[8px] text-blue/60">
              {[0, 25, 50, 75, 100].map((n) => <span key={n}>{n}</span>)}
            </div>
          </Win>

          <Win title="Overall" delay={300}>
            <div className="flex gap-3">
              <VMeters values={KEYS.map((k) => s[k])} labels={KEYS.map((k) => k[0])} height={64} />
              <div className="flex flex-1 flex-col justify-between gap-2">
                <Spark data={KEYS.map((k) => s[k])} className="text-blue" />
                <div className="flex items-end gap-2">
                  <span className="border border-blue px-1 font-mono text-lg font-semibold leading-none text-blue">{subject.overall}</span>
                  <span className="font-mono text-[8.5px] uppercase text-blue">Level</span>
                </div>
              </div>
            </div>
            <div className="mt-2 font-mono text-[8.5px] uppercase text-blue/70">Active days</div>
            <div className="font-mono text-[11px] text-blue">00:00:{String(subject.raw.activeDays).padStart(3, "0")}:{seconds}</div>
          </Win>

          <Win title="Not a social network — just cards" delay={400}>
            <p className="font-mono text-[10.5px] leading-snug text-blue">
              Specsheet reads your public commits, languages and shipped projects and prints a rated card. Your best
              repos become moves. Compare, collect, climb the board.
            </p>
            <div className="mt-2 flex gap-1.5 font-mono text-[9px] uppercase">
              <Link href="/leaderboard" className="border border-blue px-1 text-blue hover:bg-blue hover:text-white">Board</Link>
              <Link href="/compare" className="border border-blue px-1 text-blue hover:bg-blue hover:text-white">Versus</Link>
              <Link href="/binder" className="border border-blue px-1 text-blue hover:bg-blue hover:text-white">Binder</Link>
            </div>
          </Win>
        </div>

        {/* bottom-left list */}
        <div className="relative z-10 mt-8 lg:absolute lg:left-6 lg:top-[580px] lg:mt-0 lg:w-[300px]">
          <Bracket>Core stats of the subject</Bracket>
          <div className="mt-1">
            {KEYS.map((k, i) => (
              <ThreadRow key={k} index={String(i + 1).padStart(2, "0")} code={k} label={STAT_LABELS[k]} value={s[k]} />
            ))}
          </div>
        </div>

        <Axis className="relative z-0 mt-8 hidden lg:absolute lg:inset-x-[340px] lg:bottom-6 lg:block" unit="" />
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="mx-4 mt-10 border-t border-blue/40 pt-10 sm:mx-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Headline as="h2" className="text-[clamp(36px,4.6vw,64px)]">Scan. Rate.<br />Collect.</Headline>
          <Bracket>Procedure</Bracket>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["01 · Scan", "We read 12 months of public commits, pull requests, reviews, languages and deployed repos."],
            ["02 · Rate", "Six stats, one overall, a rarity tier and a role. Your top repos become moves with a power number."],
            ["03 · Collect", "Download the card, put two developers head to head, and climb your country or stack board."],
          ].map(([t, d], i) => (
            <Win key={t} title={t} delay={i * 120}>
              <p className="font-mono text-[11px] leading-relaxed text-blue">{d}</p>
              <Barcode value={t} className="mt-3 h-4 w-20" />
            </Win>
          ))}
        </div>
      </section>

      {/* ───────────── STATS TABLE ───────────── */}
      <section className="mx-4 mt-16 sm:mx-6">
        <Bracket>Six stats · all earned</Bracket>
        <div className="mt-3 border border-blue bg-white">
          {KEYS.map((k, i) => (
            <div key={k} className="grid grid-cols-[48px_1fr] items-center gap-4 border-b border-blue/25 px-3 py-3 last:border-0 sm:grid-cols-[48px_160px_1fr_160px]">
              <span className="font-mono text-[11px] text-blue/60">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-serif text-2xl font-light uppercase text-blue">{k} <span className="text-base">{STAT_LABELS[k]}</span></span>
              <span className="col-span-2 font-mono text-[11px] text-blue sm:col-span-1">{STAT_HINTS[k]}</span>
              <Cells value={sampleCard("gold").stats[k]} count={16} className="col-span-2 sm:col-span-1" delay={i * 0.05} />
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── SUBJECTS ───────────── */}
      {featured.length > 0 && (
        <section className="mx-4 mt-16 sm:mx-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Headline as="h2" className="text-[clamp(36px,4.6vw,64px)]">Top of the<br />Ethiopia board.</Headline>
            <Link href="/leaderboard" className="border border-blue px-2 py-[2px] font-mono text-[10px] font-semibold uppercase text-blue hover:bg-blue hover:text-white">
              Open the board →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
            {featured.map((c, i) => (
              <Link key={c.login} href={`/u/${c.login}`} className="group border border-blue/40 bg-white p-3 transition-colors hover:border-blue">
                <div className="flex justify-between font-mono text-[9px] uppercase text-blue/70">
                  <span>Subject_{String(i + 1).padStart(2, "0")}</span>
                  <span>{c.overall}</span>
                </div>
                <div className="mt-2 flex justify-center">
                  <DevCard card={c} scale={0.52} flippable={false} slab={false} interactive={false} />
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase text-blue group-hover:underline">@{c.login}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
