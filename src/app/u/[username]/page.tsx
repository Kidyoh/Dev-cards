import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { CardActions } from "@/components/CardActions";
import { ErrorBox } from "@/components/ErrorBox";
import { Barcode, Bracket, Eyebrow, HudPanel, PixelReveal, SegBar, Sheet } from "@/components/hud";
import { Materialize } from "@/components/Materialize";
import { StatBars, StatRadar } from "@/components/StatPanel";
import { getCard } from "@/lib/cards";
import { GitHubError } from "@/lib/github";
import { siteUrl } from "@/lib/site";
import { RARITY } from "@/lib/theme";
import type { CardData } from "@/lib/types";

type Props = { params: Promise<{ username: string }> };

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

const TIER_BADGE: Record<CardData["rarity"], string> = {
  bronze: "bg-[#6a3c18] text-[#f3c79a]",
  silver: "bg-[#5d6672] text-white",
  gold: "bg-ink text-lime",
  legacy: "bg-lime text-ink",
};

export default async function CardPage({ params }: Props) {
  const { username } = await params;
  const { card, error } = await load(username);
  if (!card) {
    return (
      <Sheet>
        <ErrorBox error={error} />
      </Sheet>
    );
  }

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
      <Sheet tone="light" className="blueprint" inner="pt-10 md:pt-14">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
          <span>Card / {card.login}</span>
          <span className="hidden sm:block">{card.location ?? "Earth"}</span>
          <Barcode value={card.login} className="h-4 text-ink/60" />
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-12 lg:grid-cols-[400px_1fr] xl:grid-cols-[580px_1fr]">
          <div className="flex min-w-0 justify-center lg:sticky lg:top-28">
            <Materialize card={card} />
          </div>

          <div className="min-w-0">
            <Eyebrow>{`${card.element.name} type · ${card.role.name}`}</Eyebrow>
            <PixelReveal cols={18} rows={3}>
              <h1 className="mt-4 break-words text-[clamp(44px,6.5vw,84px)] font-bold leading-[0.92]">{card.name}</h1>
            </PixelReveal>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className={`rounded-md px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] ${TIER_BADGE[card.rarity]}`}>
                {RARITY[card.rarity].label}
              </span>
              <span className="font-display text-2xl font-bold">{card.overall}</span>
              <span className="text-mute">overall</span>
              <a
                href={`https://github.com/${card.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-sm underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
              >
                @{card.login} <ArrowUpRight className="size-3.5" />
              </a>
            </div>

            <div className="mt-8">
              <CardActions login={card.login} overall={card.overall} name={card.name} url={url} />
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line px-6 py-3">
                <Bracket>Stat readout</Bracket>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Last 12 months</span>
              </div>
              <div className="grid items-center gap-6 p-6 2xl:grid-cols-[200px_1fr]">
                <div className="mx-auto w-[200px] text-ink"><StatRadar cards={[card]} /></div>
                <StatBars card={card} />
              </div>
              {card.languages.length > 0 && (
                <div className="border-t border-line px-6 py-5">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Languages</div>
                  <div className="flex h-3 gap-[2px] overflow-hidden rounded-sm">
                    {card.languages.map((l) => (
                      <i key={l.name} style={{ width: `${l.share * 100}%`, background: l.color ?? "#777" }} title={l.name} />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-mute">
                    {card.languages.map((l) => (
                      <span key={l.name} className="inline-flex items-center gap-1.5">
                        <i className="inline-block size-2 rounded-[1px]" style={{ background: l.color ?? "#777" }} />
                        {l.name} {Math.round(l.share * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet tone="dark" backdrop={<div className="blueprint-dark absolute inset-0" />}>
        <div className="relative grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <Eyebrow className="text-white">Moveset</Eyebrow>
            <h2 className="mt-4 text-[clamp(36px,5vw,64px)] font-bold leading-[0.95]">
              Signature <span className="text-lime">moves.</span>
            </h2>
            <p className="mt-5 max-w-sm text-white/60">
              Top repos by stars, forks, releases, lifespan and whether they&apos;re live. Power is out of 250.
            </p>
            <div className="mt-10 rounded-2xl border border-line-dark p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Abilities</div>
              <ol className="mt-4 space-y-3">
                {card.abilities.map((a, i) => (
                  <li key={a.name} className="grid grid-cols-[28px_1fr] gap-2 text-sm">
                    <span className="font-mono text-lime">0{i + 1}</span>
                    <span>
                      <b className="font-semibold">{a.name}.</b> <span className="text-white/60">{a.description}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="grid gap-3">
            {card.moves.length === 0 && <p className="text-white/60">No public projects yet.</p>}
            {card.moves.map((m, i) => (
              <a
                key={m.name}
                href={m.homepage ?? m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid gap-4 rounded-2xl border border-line-dark bg-ink-2 p-6 transition-colors hover:border-lime/60 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    <span>Move_0{i + 1}</span>
                    {m.deployed && <span className="rounded-sm bg-lime px-1.5 py-0.5 font-bold text-ink">Live</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="size-2.5 rounded-[2px]" style={{ background: m.languageColor ?? "#777" }} />
                    <span className="truncate font-display text-2xl font-semibold">{m.name}</span>
                    <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-2 text-sm text-white/55">{m.description}</p>
                  <div className="mt-3 font-mono text-[11px] text-white/45">
                    {m.language ?? "—"} · ★ {m.stars.toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="font-display text-5xl font-bold text-lime tabular-nums">{m.power}</span>
                  <SegBar value={(m.power / 250) * 100} segments={12} color="var(--color-lime)" track="rgb(246 246 241 / 0.1)" className="h-1.5 w-28" />
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="relative mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {facts.map(([label, v]) => (
            <HudPanel key={label} title={label} tone="dark" className="border-line-dark">
              <span className="font-display text-3xl font-bold tabular-nums">{v.toLocaleString()}</span>
            </HudPanel>
          ))}
        </div>
        <p className="relative mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
          Scanned {new Date(card.generatedAt).toUTCString()} · refreshes every 6h
        </p>
      </Sheet>
    </>
  );
}
