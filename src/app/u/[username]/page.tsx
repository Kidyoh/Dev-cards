import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Barcode, Bracket, Cells, Headline, Label, Spark, Tag, VMeters, Win } from "@/components/bp";
import { CardActions } from "@/components/CardActions";
import { Callouts } from "@/components/Callouts";
import { DevCard } from "@/components/DevCard";
import { ErrorBox } from "@/components/ErrorBox";
import { getCard } from "@/lib/cards";
import { GitHubError } from "@/lib/github";
import { siteUrl } from "@/lib/site";
import { RARITY } from "@/lib/theme";
import { STAT_LABELS, type CardData, type StatKey } from "@/lib/types";

type Props = { params: Promise<{ username: string }> };
const KEYS: StatKey[] = ["SHP", "CON", "RNG", "DEP", "IMP", "COL"];

async function load(username: string): Promise<{ card?: CardData; error?: unknown }> {
  try {
    return { card: await getCard(decodeURIComponent(username)) };
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) notFound();
    return { error };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { card } = await load(username);
  if (!card) return { title: username };
  const title = `${card.name}: ${card.overall} ${card.role.name}`;
  const description = `${RARITY[card.rarity].label} card · SHP ${card.stats.SHP} · CON ${card.stats.CON} · RNG ${card.stats.RNG} · DEP ${card.stats.DEP}`;
  const image = `/api/card/${card.login}/image?format=og`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CardPage({ params }: Props) {
  const { username } = await params;
  const { card, error } = await load(username);
  if (!card) return <div className="mx-4 mt-10 sm:mx-6"><ErrorBox error={error} /></div>;

  const url = `${siteUrl()}/u/${card.login}`;
  const facts: [string, number][] = [
    ["Contributions", card.raw.contributions],
    ["Commits", card.raw.commits],
    ["Pull requests", card.raw.pullRequests],
    ["Reviews", card.raw.reviews],
    ["Active days", card.raw.activeDays],
    ["Longest streak", card.raw.longestStreak],
    ["Stars", card.raw.stars],
    ["Followers", card.raw.followers],
    ["Public repos", card.raw.publicRepos],
    ["Deployed", card.raw.deployedProjects],
  ];

  return (
    <>
      <section className="grid gap-10 px-4 pt-6 sm:px-6 xl:grid-cols-[260px_1fr_250px]">
        {/* left: identity */}
        <div className="flex flex-col gap-5">
          <div>
            <Label className="text-blue/60">Subject file / {card.login}</Label>
            <Headline className="mt-2 break-words text-[clamp(40px,4.6vw,64px)]">{card.name}</Headline>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{RARITY[card.rarity].label}</Tag>
            <span className="font-mono text-[11px] uppercase text-blue">{card.overall} OVR · {card.role.name} · {card.element.name}</span>
          </div>
          <a href={`https://github.com/${card.login}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase text-blue underline underline-offset-2">
            github.com/{card.login} ↗
          </a>
          <CardActions login={card.login} overall={card.overall} url={url} />
          <Win title="Abilities" delay={150}>
            <ol className="space-y-1.5 font-mono text-[10.5px] text-blue">
              {card.abilities.map((a, i) => (
                <li key={a.name}><span className="text-blue/60">0{i + 1}.</span> <b className="uppercase">{a.name}</b> — {a.description}</li>
              ))}
            </ol>
          </Win>
        </div>

        {/* center: the card */}
        <div className="flex flex-col items-center gap-3">
          <Callouts card={card}>
            <DevCard card={card} idle countUp />
          </Callouts>
          <div className="flex w-full max-w-[340px] justify-between font-mono text-[9px] uppercase text-blue/70">
            <span>Drag to tilt · click to flip</span>
            <Barcode value={card.login} className="h-3 w-16" />
          </div>
        </div>

        {/* right: readouts */}
        <div className="flex flex-col gap-4">
          <Win title="Readout · 12 months" delay={100}>
            <div className="space-y-2">
              {KEYS.map((k, i) => (
                <div key={k}>
                  <div className="flex justify-between font-mono text-[9.5px] uppercase text-blue">
                    <span>{k} · {STAT_LABELS[k]}</span>
                    <b>{card.stats[k]}</b>
                  </div>
                  <Cells value={card.stats[k]} count={18} className="mt-0.5 h-2.5" delay={0.2 + i * 0.08} />
                </div>
              ))}
            </div>
          </Win>
          <Win title="Overall" delay={200}>
            <div className="flex gap-3">
              <VMeters values={KEYS.map((k) => card.stats[k])} labels={KEYS.map((k) => k[0])} height={60} />
              <div className="flex flex-1 flex-col justify-between">
                <Spark data={KEYS.map((k) => card.stats[k])} className="text-blue" />
                <div className="flex items-end gap-2">
                  <span className="border border-blue px-1 font-mono text-lg font-semibold leading-none text-blue">{card.overall}</span>
                  <span className="font-mono text-[8.5px] uppercase text-blue">Level</span>
                </div>
              </div>
            </div>
          </Win>
          {card.languages.length > 0 && (
            <Win title="Languages" delay={300}>
              <div className="flex h-2.5 border border-blue">
                {card.languages.map((l, i) => (
                  <i key={l.name} className={i % 2 ? "dither" : "bg-blue"} style={{ width: `${l.share * 100}%` }} title={l.name} />
                ))}
              </div>
              <div className="mt-1.5 space-y-0.5 font-mono text-[9.5px] uppercase text-blue">
                {card.languages.map((l) => (
                  <div key={l.name} className="flex justify-between"><span>{l.name}</span><span>{Math.round(l.share * 100)}%</span></div>
                ))}
              </div>
            </Win>
          )}
        </div>
      </section>

      <section className="mx-4 mt-16 border-t border-blue/40 pt-8 sm:mx-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Headline as="h2" className="text-[clamp(32px,4vw,56px)]">Moveset.</Headline>
          <Bracket>Top repos · power out of 250</Bracket>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {card.moves.length === 0 && <p className="font-mono text-[11px] uppercase text-blue">No public projects yet.</p>}
          {card.moves.map((m, i) => (
            <a key={m.name} href={m.homepage ?? m.url} target="_blank" rel="noopener noreferrer" className="block">
              <Win title={`Move_0${i + 1}${m.deployed ? " · live" : ""}`} delay={i * 120} className="h-full hover:shadow-[4px_4px_0_0_#2f3fc2]">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 truncate font-serif text-2xl font-light uppercase text-blue">{m.name}</span>
                  <span className="font-mono text-2xl font-semibold text-blue">{m.power}</span>
                </div>
                <Cells value={(m.power / 250) * 100} count={20} className="mt-2 h-2" />
                <p className="mt-2 font-mono text-[10.5px] leading-snug text-blue">{m.description}</p>
                <div className="mt-2 font-mono text-[9.5px] uppercase text-blue/70">{m.language ?? "—"} · ★ {m.stars.toLocaleString()}</div>
              </Win>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-4 mt-16 sm:mx-6">
        <Bracket>Raw data · last 12 months</Bracket>
        <div className="mt-3 grid grid-cols-2 border-l border-t border-blue bg-white sm:grid-cols-5">
          {facts.map(([label, v]) => (
            <div key={label} className="border-b border-r border-blue p-3">
              <div className="font-mono text-[9px] uppercase text-blue/70">{label}</div>
              <div className="font-serif text-3xl font-light text-blue">{v.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[9px] uppercase text-blue/60">Scanned {new Date(card.generatedAt).toUTCString()} · refreshes every 6h</p>
      </section>
    </>
  );
}
