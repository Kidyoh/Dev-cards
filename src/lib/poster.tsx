/* The downloadable "spec sheet" poster (1080×1350): the card inside the site's blueprint HUD.
   Satori needs display:flex on any element with more than one child; lines/icons are SVG data URIs. */
import { CardOrSlab, cardSize } from "./render";
import type { CardData, StatKey } from "./types";
import { STAT_LABELS } from "./types";

export const POSTER = { width: 1080, height: 1350 };

const B = "#2f3fc2";
const B60 = "rgba(47,63,194,0.6)";
const B25 = "rgba(47,63,194,0.25)";
const KEYS: StatKey[] = ["SHP", "CON", "RNG", "DEP", "IMP", "COL"];
const mono = { fontFamily: "IBM Plex Mono", textTransform: "uppercase" as const };
const serif = { fontFamily: "Zilla Slab", fontWeight: 300 as const, textTransform: "uppercase" as const };

const svgUri = (w: number, h: number, body: string) =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`).toString("base64")}`;

function barcodeUri(value: string, w = 180, h = 30) {
  let hsh = 2166136261;
  let x = 0;
  let body = "";
  for (let i = 0; i < 46 && x < w; i++) {
    hsh = Math.imul(hsh ^ value.charCodeAt(i % Math.max(1, value.length)), 16777619) >>> 0;
    const bw = 1 + (hsh % 3);
    if (i % 2 === 0) body += `<rect x="${x}" y="0" width="${bw}" height="${h}" fill="${B}"/>`;
    x += bw + 2;
  }
  return svgUri(w, h, body);
}

const GLOBE = svgUri(
  28,
  28,
  `<g fill="none" stroke="${B}" stroke-width="1"><circle cx="14" cy="14" r="12"/><ellipse cx="14" cy="14" rx="5.5" ry="12"/><path d="M2 14h24M4 8h20M4 20h20"/></g>`,
);

function Win({ title, width, height, children }: { title: string; width: number; height: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width, height, border: `1.5px solid ${B}`, background: "#ffffff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: B, color: "#fff", padding: "4px 10px", fontSize: 15, ...mono }}>
        <div style={{ display: "flex" }}>{title}</div>
        <div style={{ display: "flex", width: 16, height: 16, border: "1.5px solid #fff", fontSize: 11, alignItems: "center", justifyContent: "center" }}>×</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

function Cells({ value, count, size = 13 }: { value: number; count: number; size?: number }) {
  const on = Math.round((value / 100) * count);
  return (
    <div style={{ display: "flex" }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ display: "flex", width: size, height: size, marginRight: 3, border: `1.5px solid ${B}`, background: i < on ? B : "transparent" }} />
      ))}
    </div>
  );
}

export function SpecPoster({ card, avatar, site }: { card: CardData; avatar: string | null; site: string }) {
  const { width: W, height: H } = POSTER;
  const P = 48;
  const slab = card.rarity === "legacy";
  const s = slab ? 0.84 : 1.06;
  const cs = cardSize(card, s);
  const cardX = Math.round((W - cs.width) / 2);
  const cardY = 340;
  // features on the card in card-space px (the slab offsets the card by 20,100)
  const ox = slab ? 20 : 0;
  const oy = slab ? 100 : 0;
  const at = (x: number, y: number) => ({ x: cardX + (ox + x) * s, y: cardY + (oy + y) * s });
  const leftEdge = cardX - 26;
  const rightEdge = cardX + cs.width + 26;

  const callouts = [
    { p: at(78, 82), side: "l", ly: 392, k: "Overall rating", v: `${card.overall} · ${card.rarity}` },
    { p: at(80, 178), side: "l", ly: 540, k: "Type", v: card.element.name },
    { p: at(96, 292), side: "l", ly: 688, k: "Role", v: card.role.name },
    { p: at(236, 70), side: "r", ly: 392, k: "Subject", v: `@${card.login}` },
    { p: at(150, 214), side: "r", ly: 540, k: "Top language", v: card.languages[0]?.name ?? "—" },
    { p: at(214, 346), side: "r", ly: 688, k: "Ability", v: card.abilities[0]?.name ?? "—" },
  ] as const;

  const lines = callouts
    .map((c) => {
      const ex = c.side === "l" ? leftEdge : rightEdge;
      const end = c.side === "l" ? P : W - P;
      return `<path d="M${c.p.x} ${c.p.y} L${ex} ${c.ly} L${end} ${c.ly}" fill="none" stroke="${B}" stroke-width="1.2"/>
        <rect x="${c.p.x - 4.5}" y="${c.p.y - 4.5}" width="9" height="9" fill="#fff" stroke="${B}" stroke-width="1.2"/>`;
    })
    .join("");
  // ruler along the bottom with a marker at the overall
  const axY = 1200;
  const axX0 = P, axX1 = W - P;
  const ax = (v: number) => axX0 + (v / 100) * (axX1 - axX0);
  let ruler = `<line x1="${axX0}" y1="${axY}" x2="${axX1}" y2="${axY}" stroke="${B60}" stroke-width="1"/>`;
  for (let v = 0; v <= 100; v += 5) ruler += `<line x1="${ax(v)}" y1="${axY}" x2="${ax(v)}" y2="${axY + (v % 10 === 0 ? 10 : 5)}" stroke="${B60}" stroke-width="1"/>`;
  ruler += `<path d="M${ax(card.overall) - 7} ${axY - 12} L${ax(card.overall) + 7} ${axY - 12} L${ax(card.overall)} ${axY - 2} Z" fill="${B}"/>`;
  const overlay = svgUri(W, H, lines + ruler);

  const date = new Date(card.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const nameSize = card.name.length > 18 ? 58 : card.name.length > 13 ? 72 : 92;
  const winW = Math.floor((W - P * 2 - 2 * 18) / 3);
  const winY = 852;
  const winH = 300;

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: W,
        height: H,
        color: B,
        fontFamily: "IBM Plex Mono",
        backgroundColor: "#fcfcfe",
        backgroundImage:
          "linear-gradient(to right, rgba(47,63,194,0.11) 1px, transparent 1px), linear-gradient(to bottom, rgba(47,63,194,0.11) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", position: "absolute", left: P, top: 40, flexDirection: "column" }}>
        <div style={{ display: "flex", background: B, color: "#fff", padding: "2px 10px", fontFamily: "Zilla Slab", fontSize: 26, letterSpacing: 1 }}>SPECSHEET</div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 13, ...mono }}>Series 01 · public GitHub data</div>
      </div>
      <div style={{ display: "flex", position: "absolute", left: 0, right: 0, top: 40, flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", border: `1.5px solid ${B}`, padding: "2px 10px", fontSize: 15, background: "#fff", ...mono }}>{`Subject file / ${card.login}`}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GLOBE} width={28} height={28} style={{ marginTop: 8 }} alt="" />
      </div>
      <div style={{ display: "flex", position: "absolute", right: P, top: 40, flexDirection: "column", alignItems: "flex-end", fontSize: 13, ...mono }}>
        <div style={{ display: "flex", color: B60 }}>Scanned</div>
        <div style={{ display: "flex", fontSize: 16 }}>{date}</div>
      </div>

      {/* name + level */}
      <div style={{ display: "flex", position: "absolute", left: P, top: 140, right: 260, flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: nameSize, lineHeight: 0.95, ...serif }}>{card.name.slice(0, 24)}</div>
        <div style={{ display: "flex", marginTop: 14, fontSize: 18, ...mono }}>{`${card.overall} OVR · ${card.rarity} · ${card.role.name} · ${card.element.name} type`}</div>
      </div>
      <div style={{ display: "flex", position: "absolute", right: P, top: 140, flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ display: "flex", border: `1.5px solid ${B}`, background: "#fff", padding: "0 14px", fontFamily: "Zilla Slab", fontWeight: 300, fontSize: 104, lineHeight: 1 }}>{card.overall}</div>
        <div style={{ display: "flex", marginTop: 6, fontSize: 14, ...mono }}>Level / 99</div>
      </div>

      {/* card */}
      <div style={{ display: "flex", position: "absolute", left: cardX, top: cardY }}>
        <CardOrSlab card={card} avatar={avatar} s={s} />
      </div>

      {/* hairlines + ruler, drawn over the card so the feature markers sit on it */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={overlay} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />

      {/* callout labels */}
      {callouts.map((c) => (
        <div
          key={c.k}
          style={{
            display: "flex",
            position: "absolute",
            top: c.ly - 46,
            width: leftEdge - P - 30,
            flexDirection: "column",
            alignItems: c.side === "l" ? "flex-start" : "flex-end",
            ...(c.side === "l" ? { left: P } : { right: P }),
            ...mono,
          }}
        >
          <div style={{ display: "flex", fontSize: 13, color: B60 }}>{c.k}</div>
          <div style={{ display: "flex", fontSize: 19, marginTop: 2 }}>{c.v.slice(0, 22)}</div>
        </div>
      ))}

      {/* windows */}
      <div style={{ display: "flex", position: "absolute", left: P, top: winY }}>
        <Win title="Readout · 12 months" width={winW} height={winH}>
          {KEYS.map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
              <div style={{ display: "flex", width: 46, fontSize: 15, ...mono }}>{k}</div>
              <Cells value={card.stats[k]} count={12} />
              <div style={{ display: "flex", width: 30, justifyContent: "flex-end", fontSize: 16 }}>{card.stats[k]}</div>
            </div>
          ))}
        </Win>
      </div>
      <div style={{ display: "flex", position: "absolute", left: P + winW + 18, top: winY }}>
        <Win title="Overall" width={winW} height={winH}>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            {KEYS.map((k) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 10 }}>
                <div style={{ display: "flex", width: 18, height: 120, border: `1.5px solid ${B}`, alignItems: "flex-end" }}>
                  <div style={{ display: "flex", width: "100%", height: `${card.stats[k]}%`, background: B }} />
                </div>
                <div style={{ display: "flex", fontSize: 12, marginTop: 4 }}>{k[0]}</div>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 6 }}>
              <div style={{ display: "flex", fontSize: 12, color: B60, ...mono }}>Role</div>
              <div style={{ display: "flex", fontSize: 15, ...mono }}>{card.role.code}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 16, borderTop: `1px solid ${B25}`, paddingTop: 10 }}>
            {[
              ["Commits", card.raw.commits],
              ["Active days", card.raw.activeDays],
              ["Streak", card.raw.longestStreak],
              ["Stars", card.raw.stars],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: "flex", flexDirection: "column", width: "50%", marginBottom: 6 }}>
                <div style={{ display: "flex", fontSize: 11, color: B60, ...mono }}>{l}</div>
                <div style={{ display: "flex", fontSize: 20 }}>{(v as number).toLocaleString("en-US")}</div>
              </div>
            ))}
          </div>
        </Win>
      </div>
      <div style={{ display: "flex", position: "absolute", left: P + (winW + 18) * 2, top: winY }}>
        <Win title="Moveset · top repos" width={winW} height={winH}>
          {card.moves.length === 0 && <div style={{ display: "flex", fontSize: 14, ...mono }}>No public projects yet</div>}
          {card.moves.slice(0, 3).map((m, i) => (
            <div key={m.name} style={{ display: "flex", flexDirection: "column", paddingBottom: 9, marginBottom: 9, borderBottom: i < 2 ? `1px solid ${B25}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ display: "flex", fontFamily: "Zilla Slab", fontWeight: 300, fontSize: 24, textTransform: "uppercase" }}>{m.name.slice(0, 15)}</div>
                <div style={{ display: "flex", fontSize: 22 }}>{m.power}</div>
              </div>
              <div style={{ display: "flex", marginTop: 4 }}>
                <Cells value={(m.power / 250) * 100} count={18} size={9} />
              </div>
              <div style={{ display: "flex", fontSize: 11, marginTop: 4, color: B60, ...mono }}>
                {`${m.language ?? "—"} · ★ ${m.stars.toLocaleString("en-US")}${m.deployed ? " · live" : ""}`}
              </div>
            </div>
          ))}
        </Win>
      </div>

      {/* ruler labels */}
      {[0, 20, 40, 60, 80, 100].map((v) => (
        <div key={v} style={{ display: "flex", position: "absolute", top: axY + 14, left: ax(v) - 20, width: 40, justifyContent: "center", fontSize: 12, color: B60 }}>{v}</div>
      ))}
      <div style={{ display: "flex", position: "absolute", top: axY - 40, left: ax(card.overall) - 60, width: 120, justifyContent: "center", fontSize: 13, ...mono }}>{`OVR ${card.overall}`}</div>

      {/* footer */}
      <div style={{ display: "flex", position: "absolute", left: P, right: P, top: 1262, borderTop: `1.5px solid ${B}`, paddingTop: 14, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", ...mono }}>
          <div style={{ display: "flex", fontSize: 12, color: B60 }}>Scan yours</div>
          <div style={{ display: "flex", fontSize: 18 }}>{`${site.replace(/^https?:\/\//, "")}/u/${card.login}`}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={barcodeUri(card.login)} width={180} height={30} alt="" />
      </div>
    </div>
  );
}
