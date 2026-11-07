import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardActions } from "@/components/CardActions";
import { DevCard } from "@/components/DevCard";
import { ErrorBox } from "@/components/ErrorBox";
import { getCard } from "@/lib/cards";
import { GitHubError } from "@/lib/github";
import { siteUrl } from "@/lib/site";
import { RARITY } from "@/lib/theme";
import { STAT_HINTS, STAT_LABELS, type CardData, type StatKey } from "@/lib/types";

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
  const keys = Object.keys(STAT_LABELS) as StatKey[];

  return (
    <div className="card-page">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <DevCard card={card} />
        <span className="muted" style={{ fontSize: 12 }}>Click the card to flip it and see the moves</span>
      </div>

      <div style={{ minWidth: 0, width: "100%" }}>
        <h1 style={{ marginTop: 0 }}>
          {card.name}
        </h1>
        <p className="muted" style={{ marginTop: -4 }}>
          <span className={`pill ${card.rarity}`}>{RARITY[card.rarity].label}</span>{" "}
          {card.overall} overall · {card.role.name} · {card.element.name} type
          {card.location ? ` · ${card.location}` : ""} ·{" "}
          <a href={`https://github.com/${card.login}`} target="_blank" rel="noopener noreferrer">@{card.login}</a>
        </p>

        <CardActions login={card.login} overall={card.overall} name={card.name} url={url} />

        <h2>Stats</h2>
        {keys.map((k) => (
          <div key={k} className="statrow" title={STAT_HINTS[k]}>
            <span>{STAT_LABELS[k]}</span>
            <div className="bar"><i style={{ width: `${card.stats[k]}%` }} /></div>
            <b style={{ textAlign: "right" }}>{card.stats[k]}</b>
          </div>
        ))}

        {card.languages.length > 0 && (
          <>
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
          </>
        )}

        <h2>Moves</h2>
        <div className="facts" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {card.moves.map((m) => (
            <a key={m.name} className="fact" href={m.homepage ?? m.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <b style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
                <span>{m.power}</span>
              </b>
              <span>{m.language ?? "—"} · ★ {m.stars.toLocaleString()}{m.deployed ? " · live" : ""}</span>
              <p style={{ fontSize: 13, margin: "6px 0 0" }}>{m.description}</p>
            </a>
          ))}
        </div>

        <h2>Abilities</h2>
        {card.abilities.map((a) => (
          <p key={a.name}><b>{a.name}.</b> <span className="muted">{a.description}</span></p>
        ))}

        <h2>The numbers behind it</h2>
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
            <div className="fact" key={label as string}>
              <b>{(v as number).toLocaleString()}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
          Updated {new Date(card.generatedAt).toUTCString()}. Cards refresh every 6 hours.
        </p>
      </div>
    </div>
  );
}
