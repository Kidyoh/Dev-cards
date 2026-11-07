/* Satori (next/og) renderers for the shareable PNGs. Satori needs display:flex on every element
   with more than one child and supports a subset of CSS, so this mirrors DevCard.tsx by hand. */
import { RARITY, shieldDataUri } from "./theme";
import type { CardData, StatKey } from "./types";

type Font = { name: string; data: ArrayBuffer; weight: 400 | 500 | 700 | 800 | 900; style: "normal" };

let fontCache: Promise<Font[]> | null = null;

async function loadFont(family: string, name: string, weight: 500 | 700 | 900): Promise<Font | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`, {
        // A non-browser UA makes Google Fonts serve one TTF file, which Satori can read (it can't read WOFF2).
        headers: { "User-Agent": "dev-cards" },
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype|woff)'\)/)?.[1];
    if (!url) return null;
    const data = await (await fetch(url)).arrayBuffer();
    return { name, data, weight, style: "normal" };
  } catch {
    return null;
  }
}

export function fonts(): Promise<Font[]> {
  if (!fontCache) {
    fontCache = Promise.all([
      loadFont("Inter", "Inter", 500),
      loadFont("Inter", "Inter", 900),
      loadFont("Space+Grotesk", "Space Grotesk", 700),
      loadFont("JetBrains+Mono", "JetBrains Mono", 500),
    ]).then((f) => f.filter((x): x is Font => !!x));
    fontCache.then((f) => {
      if (!f.length) fontCache = null; // retry next time if the network failed
    });
  }
  return fontCache;
}

/** Fetch the avatar ourselves so a broken image can't fail the whole render. */
export async function avatarDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const LEFT: StatKey[] = ["SHP", "CON", "RNG"];
const RIGHT: StatKey[] = ["DEP", "IMP", "COL"];

/** Card front at 300x420 * s. */
export function CardFront({ card, avatar, s }: { card: CardData; avatar: string | null; s: number }) {
  const t = RARITY[card.rarity];
  const px = (n: number) => n * s;
  return (
    <div style={{ display: "flex", position: "relative", width: px(300), height: px(420), color: t.text, fontFamily: "Inter" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shieldDataUri(card.rarity, px(300), px(420))} width={px(300)} height={px(420)} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      <div style={{ position: "absolute", left: px(44), top: px(50), width: px(70), display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: px(54), fontWeight: 900, lineHeight: 1, letterSpacing: px(-1.5) }}>{card.overall}</div>
        <div style={{ display: "flex", fontSize: px(18), fontWeight: 900, marginTop: px(2) }}>{card.role.code}</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: px(10), fontSize: px(10), fontWeight: 900, textTransform: "uppercase" }}>
          <div style={{ display: "flex", width: px(8), height: px(8), borderRadius: px(8), background: card.element.color, marginRight: px(4) }} />
          {card.element.name}
        </div>
        {card.languages[0] && <div style={{ display: "flex", fontSize: px(10), marginTop: px(4), opacity: 0.75 }}>{card.languages[0].name}</div>}
      </div>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} width={px(142)} height={px(142)} alt=""
          style={{ position: "absolute", left: px(118), top: px(46), borderRadius: px(142), border: `${px(3)}px solid ${t.trim}`, objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", left: px(118), top: px(46), width: px(142), height: px(142), borderRadius: px(142), border: `${px(3)}px solid ${t.trim}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: px(64), fontWeight: 900, background: "rgba(0,0,0,0.08)" }}>
          {card.login.charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ position: "absolute", left: px(40), width: px(220), top: px(200), display: "flex", justifyContent: "center", fontSize: px(card.name.length > 16 ? 16 : 21), fontWeight: 900, textTransform: "uppercase" }}>
        {card.name.length > 22 ? card.name.slice(0, 21) + "…" : card.name}
      </div>
      <div style={{ display: "flex", position: "absolute", left: px(70), width: px(160), top: px(234), height: Math.max(1, px(1)), background: t.line }} />
      <div style={{ position: "absolute", left: px(62), width: px(176), top: px(244), display: "flex", justifyContent: "space-around" }}>
        {[LEFT, RIGHT].map((col, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column" }}>
            {col.map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "baseline", fontSize: px(20), marginBottom: px(3) }}>
                <div style={{ fontWeight: 900, width: px(28), display: "flex", justifyContent: "flex-end", marginRight: px(8) }}>{card.stats[k]}</div>
                <div style={{ display: "flex", fontWeight: 500 }}>{k}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", position: "absolute", left: px(149.5), top: px(248), width: Math.max(1, px(1)), height: px(80), background: t.line }} />
      <div style={{ position: "absolute", left: px(40), width: px(220), top: px(340), display: "flex", justifyContent: "center", fontSize: px(11), fontWeight: 900, textTransform: "uppercase", letterSpacing: px(0.8), color: t.sub }}>
        {`· ${card.abilities[0]?.name ?? ""} ·`}
      </div>
      <div style={{ position: "absolute", left: px(40), width: px(220), top: px(358), display: "flex", justifyContent: "center", fontSize: px(11), color: t.sub }}>
        {`@${card.login}`}
      </div>
    </div>
  );
}

/** Legacy cards are shown inside a graded slab. */
export function Slab({ card, avatar, s }: { card: CardData; avatar: string | null; s: number }) {
  const px = (n: number) => n * s;
  return (
    <div style={{ display: "flex", flexDirection: "column", width: px(340), height: px(530), padding: px(10), borderRadius: px(18), background: "linear-gradient(135deg, #cfe2e4, #9fbcc0 45%, #d9ebec)", border: `${px(1)}px solid rgba(255,255,255,0.7)`, fontFamily: "Inter" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: px(80), padding: `${px(10)}px ${px(14)}px`, borderRadius: px(8), background: "linear-gradient(#ffffff, #f3f1ea)", border: `${px(4)}px solid #b8913a`, color: "#222" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: px(14), fontWeight: 900 }}>{card.name.toUpperCase().slice(0, 24)}</div>
          <div style={{ display: "flex", fontSize: px(11), marginTop: px(2) }}>{`${(card.languages[0]?.name ?? "Developer").toUpperCase()} · ${card.role.name.toUpperCase()}`}</div>
          <div style={{ display: "flex", fontSize: px(8), marginTop: px(8), letterSpacing: px(1), color: "#7a6326" }}>DEV CARDS · LEGACY</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#7a6326" }}>
          <div style={{ display: "flex", fontSize: px(8), letterSpacing: px(1) }}>GRADE</div>
          <div style={{ display: "flex", fontSize: px(26), fontWeight: 900, color: "#3a2e12" }}>{(card.overall / 10).toFixed(1)}</div>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, marginTop: px(10), alignItems: "center", justifyContent: "center", borderRadius: px(10), background: "rgba(255,255,255,0.12)", border: `${px(2)}px solid rgba(255,255,255,0.45)` }}>
        <CardFront card={card} avatar={avatar} s={s} />
      </div>
    </div>
  );
}

export function CardOrSlab(props: { card: CardData; avatar: string | null; s: number }) {
  return props.card.rarity === "legacy" ? <Slab {...props} /> : <CardFront {...props} />;
}

export function cardSize(card: CardData, s: number) {
  return card.rarity === "legacy" ? { width: 340 * s, height: 530 * s } : { width: 300 * s, height: 420 * s };
}

/** 1200x630 social image in the site's HUD style: ink sheet, card left, readout right. */
export function OgImage({ card, avatar, site }: { card: CardData; avatar: string | null; site: string }) {
  const s = card.rarity === "legacy" ? 1.0 : 1.28;
  const keys: StatKey[] = ["SHP", "CON", "RNG", "DEP", "IMP", "COL"];
  const mono = { fontFamily: "JetBrains Mono", textTransform: "uppercase" as const, letterSpacing: 3 };
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 630, background: "#121311", color: "#f6f6f1", fontFamily: "Inter", padding: "34px 54px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "rgba(246,246,241,0.45)", ...mono }}>
        <div style={{ display: "flex" }}>Dev Cards / Series 01</div>
        <div style={{ display: "flex" }}>{`Card / ${card.login}`}</div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
        <div style={{ display: "flex", width: 470, justifyContent: "center" }}>
          <CardOrSlab card={card} avatar={avatar} s={s} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingLeft: 30 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 16, ...mono }}>
            <div style={{ display: "flex", background: "#d4f53c", color: "#121311", padding: "4px 10px", borderRadius: 6, marginRight: 14 }}>{card.rarity}</div>
            <div style={{ display: "flex", color: "rgba(246,246,241,0.6)" }}>{`${card.element.name} type · ${card.role.name}`}</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Space Grotesk", fontSize: 76, lineHeight: 1, marginTop: 18, letterSpacing: -3 }}>{card.name.slice(0, 20)}</div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 12 }}>
            <div style={{ display: "flex", fontFamily: "Space Grotesk", fontSize: 54, color: "#d4f53c" }}>{card.overall}</div>
            <div style={{ display: "flex", fontSize: 22, color: "rgba(246,246,241,0.55)", marginLeft: 12 }}>{`overall · @${card.login}`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
            {keys.map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", width: 64, fontSize: 16, color: "rgba(246,246,241,0.6)", ...mono }}>{k}</div>
                <div style={{ display: "flex" }}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} style={{ display: "flex", width: 12, height: 12, marginRight: 3, borderRadius: 1, background: i < Math.round((card.stats[k] / 100) * 24) ? "#d4f53c" : "rgba(246,246,241,0.1)" }} />
                  ))}
                </div>
                <div style={{ display: "flex", marginLeft: 14, fontFamily: "Space Grotesk", fontSize: 24 }}>{card.stats[k]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "rgba(246,246,241,0.45)", ...mono }}>
        <div style={{ display: "flex", color: "#d4f53c" }}>{`${site.replace(/^https?:\/\//, "")}/u/${card.login}`}</div>
        <div style={{ display: "flex" }}>{card.moves[0] ? `Signature move · ${card.moves[0].name} ${card.moves[0].power}` : "Scan · Rate · Collect"}</div>
      </div>
    </div>
  );
}
