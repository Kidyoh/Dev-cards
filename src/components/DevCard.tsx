"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { RARITY, SHIELD_PATH } from "@/lib/theme";
import type { CardData, StatKey } from "@/lib/types";

const LEFT: StatKey[] = ["SHP", "CON", "RNG"];
const RIGHT: StatKey[] = ["DEP", "IMP", "COL"];

function Shield({ card }: { card: CardData }) {
  const t = RARITY[card.rarity];
  const id = `g-${card.login}-${card.rarity}`;
  return (
    <svg className="dc-shield" viewBox="0 0 300 420" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.stops[0]} />
          <stop offset="0.5" stopColor={t.stops[1]} />
          <stop offset="1" stopColor={t.stops[2]} />
        </linearGradient>
      </defs>
      <path d={SHIELD_PATH} fill={`url(#${id})`} stroke={t.trim} strokeWidth={5} />
      <path
        d={SHIELD_PATH}
        fill="none"
        stroke={t.trim}
        strokeOpacity={0.5}
        strokeWidth={1.5}
        transform="translate(12 14) scale(0.92)"
      />
      {card.rarity === "legacy" && (
        <g fill="none" opacity={0.7}>
          <path d="M40 120 C 90 90, 140 170, 210 120 S 280 160, 280 140" stroke="#d8ccae" strokeWidth={1.2} />
          <path d="M30 240 C 100 200, 150 280, 260 230" stroke="#d8ccae" strokeWidth={1} />
          <path d="M60 330 C 120 300, 190 350, 250 300" stroke="#e0b95a" strokeWidth={0.8} />
        </g>
      )}
    </svg>
  );
}

function Front({ card }: { card: CardData }) {
  const t = RARITY[card.rarity];
  return (
    <div className="dc-face dc-front" style={{ color: t.text }}>
      <Shield card={card} />
      <div className="dc-ovr">
        <div className="dc-ovr-num">{card.overall}</div>
        <div className="dc-ovr-role">{card.role.code}</div>
        <div className="dc-elem" title={`${card.element.name} type`}>
          <span className="dc-dot" style={{ background: card.element.color }} />
          {card.element.name}
        </div>
        {card.languages[0] && <div className="dc-lang">{card.languages[0].name}</div>}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="dc-avatar" src={card.avatarUrl} alt="" style={{ borderColor: t.trim }} />
      <div className="dc-name">{card.name}</div>
      <div className="dc-rule" style={{ background: t.line }} />
      <div className="dc-stats">
        {[LEFT, RIGHT].map((col, i) => (
          <div key={i} className="dc-col">
            {col.map((k) => (
              <div key={k} className="dc-stat">
                <b>{card.stats[k]}</b>
                <span>{k}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="dc-vrule" style={{ background: t.line }} />
      </div>
      <div className="dc-ability" style={{ color: t.sub }}>
        ✦ {card.abilities[0]?.name}
      </div>
      <div className="dc-login" style={{ color: t.sub }}>
        @{card.login}
      </div>
    </div>
  );
}

function Back({ card }: { card: CardData }) {
  const t = RARITY[card.rarity];
  return (
    <div className="dc-face dc-back" style={{ color: t.text }}>
      <Shield card={card} />
      <div className="dc-back-inner">
        <div className="dc-back-title" style={{ borderColor: t.line }}>
          <span>Moves</span>
          <span className="dc-back-sub">{card.role.name}</span>
        </div>
        {card.moves.length === 0 && <div className="dc-move-desc">No public projects yet.</div>}
        {card.moves.map((m) => (
          <div key={m.name} className="dc-move" style={{ borderColor: t.line }}>
            <div className="dc-move-head">
              <span className="dc-dot" style={{ background: m.languageColor ?? "#999" }} />
              <span className="dc-move-name">{m.name}</span>
              <span className="dc-move-pow">{m.power}</span>
            </div>
            <div className="dc-move-meta">
              {m.language ?? "—"} · ★ {m.stars.toLocaleString()}
              {m.deployed && <span className="dc-live">LIVE</span>}
            </div>
            <div className="dc-move-desc">{m.description}</div>
          </div>
        ))}
        <div className="dc-back-title small" style={{ borderColor: t.line }}>
          Abilities
        </div>
        {card.abilities.map((a) => (
          <div key={a.name} className="dc-abil">
            <b>{a.name}</b> {a.description}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DevCard({
  card,
  scale = 1,
  flippable = true,
  slab = true,
}: {
  card: CardData;
  scale?: number;
  flippable?: boolean;
  slab?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 18}deg`);
    el.style.setProperty("--holo", "1");
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--holo", "0");
  }

  const card3d = (
    <div
      ref={ref}
      className={`dc-card dc-${card.rarity}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={flippable ? () => setFlipped((f) => !f) : undefined}
      role={flippable ? "button" : undefined}
      aria-label={flippable ? `${card.name}'s card, ${card.overall} overall. Click to flip.` : undefined}
      tabIndex={flippable ? 0 : undefined}
      onKeyDown={(e) => {
        if (flippable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <div className={`dc-inner ${flipped ? "is-flipped" : ""}`}>
        <Front card={card} />
        <Back card={card} />
      </div>
      <div className="dc-holo" style={{ clipPath: `path("${SHIELD_PATH}")` } as CSSProperties} />
    </div>
  );

  const isSlab = slab && card.rarity === "legacy";
  const baseW = isSlab ? 340 : 300;
  const baseH = isSlab ? 530 : 420;

  return (
    <div className="dc-wrap" style={{ width: baseW * scale, height: baseH * scale }}>
      <div style={{ width: baseW, height: baseH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {isSlab ? (
          <div className="dc-slab">
            <div className="dc-slab-label">
              <div>
                <div className="dc-slab-name">{card.name.toUpperCase()}</div>
                <div className="dc-slab-sub">
                  {(card.languages[0]?.name ?? "Developer").toUpperCase()} · {card.role.name.toUpperCase()}
                </div>
                <div className="dc-slab-tier">DEV CARDS · LEGACY</div>
              </div>
              <div className="dc-slab-grade">
                <span>GRADE</span>
                <b>{(card.overall / 10).toFixed(1)}</b>
              </div>
            </div>
            <div className="dc-slab-window">{card3d}</div>
          </div>
        ) : (
          card3d
        )}
      </div>
    </div>
  );
}
