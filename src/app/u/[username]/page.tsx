import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardActions } from "@/components/CardActions";
import { ErrorBox } from "@/components/ErrorBox";
import { Glow } from "@/components/fx/Glow";
import { Reveal } from "@/components/fx/Reveal";
import { PackReveal } from "@/components/PackReveal";
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

export default async function CardPage({ params }: Props) {
  const { username } = await params;
  const { card, error } = await load(username);
  if (!card) return <ErrorBox error={error} />;

  const url = `${siteUrl()}/u/${card.login}`;

  return (
    <div className="card-page">
      <div className="card-col">
        <PackReveal card={card} />
        <span className="muted" style={{ fontSize: 12 }}>Drag across the card to tilt it · click to flip it</span>
      </div>

      <div style={{ minWidth: 0, width: "100%" }}>
        <Reveal>
          <p className="eyebrow"><i style={{ background: card.element.color }} /> {card.element.name} type · {card.role.name}</p>
          <h1 className="card-title">{card.name}</h1>
          <p className="muted" style={{ marginTop: -4 }}>
            <span className={`pill ${card.rarity}`}>{RARITY[card.rarity].label}</span>{" "}
            {card.overall} overall{card.location ? ` · ${card.location}` : ""} ·{" "}
            <a href={`https://github.com/${card.login}`} target="_blank" rel="noopener noreferrer">@{card.login}</a>
          </p>
          <CardActions login={card.login} overall={card.overall} name={card.name} url={url} />
        </Reveal>

        <Reveal delay={0.1}>
          <Glow className="panel stats-panel">
            <StatRadar cards={[card]} />
            <div style={{ flex: 1, minWidth: 0 }}><StatBars card={card} /></div>
          </Glow>
        </Reveal>

        {card.languages.length > 0 && (
          <Reveal>
            <h2>Languages</h2>
            <div className="langbar">
              {card.languages.map((l) => (
                <i key={l.name} style={{ width: `${l.share * 100}%`, background: l.color ?? "#777" }} title={l.name} />
              ))}
            </div>
            <div className="legend">
              {card.languages.map((l) => (
                <span key={l.name}><i style={{ background: l.color ?? "#777" }} />{l.name} {Math.round(l.share * 100)}%</span>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal><h2>Moves</h2></Reveal>
        <div className="moves">
          {card.moves.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.08}>
              <Glow as="a" className="move-tile" href={m.homepage ?? m.url} target="_blank" rel="noopener noreferrer">
                <div className="move-top">
                  <span className="dc-dot" style={{ background: m.languageColor ?? "#777" }} />
                  <b>{m.name}</b>
                  <span className="move-pow">{m.power}</span>
                </div>
                <div className="move-meter"><i style={{ width: `${(m.power / 250) * 100}%` }} /></div>
                <span className="muted" style={{ fontSize: 12 }}>
                  {m.language ?? "—"} · ★ {m.stars.toLocaleString()}{m.deployed ? " · " : ""}{m.deployed && <span className="dc-live">LIVE</span>}
                </span>
                <p>{m.description}</p>
              </Glow>
            </Reveal>
          ))}
        </div>

        <Reveal><h2>Abilities</h2></Reveal>
        <div className="abilities">
          {card.abilities.map((a, i) => (
            <Reveal key={a.name} delay={i * 0.08}>
              <Glow className="ability-tile"><b>✦ {a.name}</b><span className="muted">{a.description}</span></Glow>
            </Reveal>
          ))}
        </div>

        <Reveal><h2>The numbers behind it</h2></Reveal>
        <div className="facts">
          {[
            ["Contributions (12 mo)", card.raw.contributions],
            ["Commits (12 mo)", card.raw.commits],
            ["Pull requests (12 mo)", card.raw.pullRequests],
            ["Reviews (12 mo)", card.raw.reviews],
            ["Active days", card.raw.activeDays],
            ["Longest streak", card.raw.longestStreak],
            ["Stars", card.raw.stars],
            ["Followers", card.raw.followers],
            ["Public repos", card.raw.publicRepos],
            ["Deployed projects", card.raw.deployedProjects],
          ].map(([label, v]) => (
            <Glow className="fact" key={label as string}>
              <b>{(v as number).toLocaleString()}</b>
              <span>{label}</span>
            </Glow>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
          Updated {new Date(card.generatedAt).toUTCString()}. Cards refresh every 6 hours.
        </p>
      </div>
    </div>
  );
}
