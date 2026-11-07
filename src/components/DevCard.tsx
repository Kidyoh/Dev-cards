"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { RARITY, SHIELD_PATH } from "@/lib/theme";
import type { CardData, Rarity, StatKey } from "@/lib/types";
import { CountUp } from "./fx/CountUp";

const LEFT: StatKey[] = ["SHP", "CON", "RNG"];
const RIGHT: StatKey[] = ["DEP", "IMP", "COL"];

/** A layer that lifts off the card toward the viewer as --pop goes 0 → 1. */
function Layer({ z, className, style, children }: { z: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className={className} style={{ ...style, transform: `translateZ(calc(${z * 0.25}px + var(--pop) * ${z}px))` }}>
      {children}
    </div>
  );
}

function seeded(login: string) {
  let h = 2166136261;
  for (let i = 0; i < login.length; i++) h = Math.imul(h ^ login.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    return ((h >>> 0) % 10000) / 10000;
  };
}

const RAY_COLOR: Record<Rarity, [string, number]> = {
  bronze: ["#fff", 0.1],
  silver: ["#fff", 0.28],
  gold: ["#fff6c9", 0.35],
  legacy: ["#d7b45a", 0.2],
};

function ShieldArt({ card, uid }: { card: CardData; uid: string }) {
  const t = RARITY[card.rarity];
  const [rayColor, rayOpacity] = RAY_COLOR[card.rarity];
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a0 = (i * 20 * Math.PI) / 180;
    const a1 = ((i * 20 + 9) * Math.PI) / 180;
    const cx = 189, cy = 117, r = 420;
    return `M${cx} ${cy} L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} L${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} Z`;
  });
  return (
    <svg className="dc-shield" viewBox="0 0 300 420" aria-hidden>
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.stops[0]} />
          <stop offset="0.5" stopColor={t.stops[1]} />
          <stop offset="1" stopColor={t.stops[2]} />
        </linearGradient>
        <clipPath id={`c-${uid}`}>
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>
      <path d={SHIELD_PATH} fill={`url(#g-${uid})`} />
      <g clipPath={`url(#c-${uid})`}>
        <g fill={rayColor} opacity={rayOpacity}>
          {rays.map((d, i) => <path key={i} d={d} />)}
        </g>
        {card.rarity === "legacy" && (
          <g fill="none" opacity={0.7}>
            <path d="M40 120 C 90 90, 140 170, 210 120 S 280 160, 280 140" stroke="#d8ccae" strokeWidth={1.2} />
            <path d="M30 240 C 100 200, 150 280, 260 230" stroke="#d8ccae" strokeWidth={1} />
            <path d="M60 330 C 120 300, 190 350, 250 300" stroke="#e0b95a" strokeWidth={0.8} />
          </g>
        )}
        <rect x="0" y="236" width="300" height="200" fill="#000" opacity={card.rarity === "legacy" ? 0.02 : 0.06} />
      </g>
      <path d={SHIELD_PATH} fill="none" stroke={t.trim} strokeWidth={5} />
      <path d={SHIELD_PATH} fill="none" stroke={t.trim} strokeOpacity={0.5} strokeWidth={1.5} transform="translate(12 14) scale(0.92)" />
    </svg>
  );
}

/** Gold shards that float above the art on gold and legacy cards. */
function Shards({ rarity }: { rarity: Rarity }) {
  if (rarity !== "gold" && rarity !== "legacy") return null;
  const fill = rarity === "legacy" ? "url(#shard-legacy)" : "url(#shard-gold)";
  return (
    <svg className="dc-shield" viewBox="0 0 300 420" aria-hidden>
      <defs>
        <linearGradient id="shard-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff5c2" />
          <stop offset="0.5" stopColor="#e2b23c" />
          <stop offset="1" stopColor="#8a6410" />
        </linearGradient>
        <linearGradient id="shard-legacy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.5" stopColor="#d9b55c" />
          <stop offset="1" stopColor="#9c7a2a" />
        </linearGradient>
      </defs>
      <g fill={fill} opacity={0.9}>
        <polygon points="232,44 252,38 246,70 230,76" />
        <polygon points="256,60 268,56 262,92 252,96" />
        <polygon points="104,52 116,46 110,74 100,78" />
        <polygon points="252,150 262,146 258,172 250,176" />
      </g>
    </svg>
  );
}

function Sparkles({ card }: { card: CardData }) {
  const count = card.rarity === "legacy" ? 9 : card.rarity === "gold" ? 6 : card.rarity === "silver" ? 3 : 0;
  const items = useMemo(() => {
    const r = seeded(card.login);
    return Array.from({ length: count }, () => ({
      left: 40 + r() * 220,
      top: 30 + r() * 320,
      size: 6 + r() * 10,
      delay: r() * 3,
      dur: 1.6 + r() * 2,
    }));
  }, [card.login, count]);
  return (
    <>
      {items.map((s, i) => (
        <svg
          key={i}
          className="dc-sparkle"
          viewBox="0 0 20 20"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
          aria-hidden
        >
          <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill="#fff" />
        </svg>
      ))}
    </>
  );
}

function Num({ value, animate }: { value: number; animate: boolean }) {
  return animate ? <CountUp to={value} /> : <>{value}</>;
}

function Front({ card, uid, countUp }: { card: CardData; uid: string; countUp: boolean }) {
  const t = RARITY[card.rarity];
  return (
    <div className="dc-face dc-front" style={{ color: t.text }}>
      <ShieldArt card={card} uid={uid} />
      <div className={`dc-foil dc-foil-${card.rarity}`} style={{ clipPath: `path("${SHIELD_PATH}")` }} />
      <Layer z={14} className="dc-fill"><Shards rarity={card.rarity} /></Layer>
      <Layer z={40} className="dc-ovr">
        <div className="dc-ovr-num"><Num value={card.overall} animate={countUp} /></div>
        <div className="dc-ovr-role">{card.role.code}</div>
        <div className="dc-elem" title={`${card.element.name} type`}>
          <span className="dc-dot" style={{ background: card.element.color }} />
          {card.element.name}
        </div>
        {card.languages[0] && <div className="dc-lang">{card.languages[0].name}</div>}
      </Layer>
      <Layer z={56} className="dc-avatar-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="dc-avatar" src={card.avatarUrl} alt="" style={{ borderColor: t.trim }} draggable={false} />
      </Layer>
      <Layer z={30} className="dc-name">{card.name}</Layer>
      <Layer z={10} className="dc-rule" style={{ background: t.line }} />
      <Layer z={24} className="dc-stats">
        {[LEFT, RIGHT].map((col, i) => (
          <div key={i} className="dc-col">
            {col.map((k) => (
              <div key={k} className="dc-stat">
                <b><Num value={card.stats[k]} animate={countUp} /></b>
                <span>{k}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="dc-vrule" style={{ background: t.line }} />
      </Layer>
      <Layer z={16} className="dc-ability" style={{ color: t.sub }}>✦ {card.abilities[0]?.name}</Layer>
      <Layer z={12} className="dc-login" style={{ color: t.sub }}>@{card.login}</Layer>
      <div className="dc-glare" style={{ clipPath: `path("${SHIELD_PATH}")` }} />
      <Layer z={70} className="dc-fill"><Sparkles card={card} /></Layer>
    </div>
  );
}

function Back({ card, uid }: { card: CardData; uid: string }) {
  const t = RARITY[card.rarity];
  return (
    <div className="dc-face dc-back" style={{ color: t.text }}>
      <ShieldArt card={card} uid={`${uid}-b`} />
      <div className={`dc-foil dc-foil-${card.rarity}`} style={{ clipPath: `path("${SHIELD_PATH}")` }} />
      <div className="dc-back-inner">
        <Layer z={20} className="dc-back-title" style={{ borderColor: t.line }}>
          <span>Moves</span>
          <span className="dc-back-sub">{card.role.name}</span>
        </Layer>
        {card.moves.length === 0 && <div className="dc-move-desc">No public projects yet.</div>}
        {card.moves.map((m, i) => (
          <Layer key={m.name} z={34 - i * 6} className="dc-move" style={{ borderColor: t.line }}>
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
          </Layer>
        ))}
        <Layer z={14} className="dc-back-title small" style={{ borderColor: t.line }}>Abilities</Layer>
        {card.abilities.map((a) => (
          <Layer key={a.name} z={10} className="dc-abil"><b>{a.name}</b> {a.description}</Layer>
        ))}
      </div>
      <div className="dc-glare" style={{ clipPath: `path("${SHIELD_PATH}")` }} />
    </div>
  );
}

function useTilt(idle: boolean, interactive: boolean) {
  const reduce = useReducedMotion();
  const hovering = useRef(false);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const hover = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 170, damping: 16, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 170, damping: 16, mass: 0.6 });
  const pop = useSpring(hover, { stiffness: 220, damping: 18 });
  const rotateX = useTransform(sy, (v) => (0.5 - v) * 14);
  const rotateY = useTransform(sx, (v) => (v - 0.5) * 18);
  const glareX = useTransform(sx, (v) => `${v * 100}%`);
  const glareY = useTransform(sy, (v) => `${v * 100}%`);
  const shadowX = useTransform(sx, (v) => (0.5 - v) * 40);
  const shadowY = useTransform(sy, (v) => 26 + (0.5 - v) * 20);

  useAnimationFrame((t) => {
    if (!idle || reduce || hovering.current) return;
    mx.set(0.5 + Math.sin(t / 2600) * 0.12);
    my.set(0.5 + Math.cos(t / 3400) * 0.08);
  });

  const handlers = interactive && !reduce
    ? {
        onPointerMove(e: React.PointerEvent<HTMLElement>) {
          const r = e.currentTarget.getBoundingClientRect();
          hovering.current = true;
          mx.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
          my.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
          hover.set(1);
        },
        onPointerLeave() {
          hovering.current = false;
          mx.set(0.5);
          my.set(0.5);
          hover.set(0);
        },
      }
    : {};

  return { rotateX, rotateY, glareX, glareY, pop, sx, sy, shadowX, shadowY, handlers };
}

export function DevCard({
  card,
  scale = 1,
  flippable = true,
  slab = true,
  idle = false,
  interactive = true,
  countUp = false,
}: {
  card: CardData;
  scale?: number;
  flippable?: boolean;
  slab?: boolean;
  /** Gently sway on its own when nobody is touching it. */
  idle?: boolean;
  interactive?: boolean;
  /** Count the numbers up from zero when the card mounts. */
  countUp?: boolean;
}) {
  const uid = `${card.login}-${card.rarity}`.replace(/[^a-z0-9-]/gi, "");
  const [flipped, setFlipped] = useState(false);
  const tilt = useTilt(idle, interactive);
  const flip = useSpring(0, { stiffness: 120, damping: 16 });
  const frontVis = useTransform(flip, (r) => (((r % 360) + 360) % 360 < 90 || ((r % 360) + 360) % 360 > 270 ? "visible" : "hidden"));
  const backVis = useTransform(frontVis, (v) => (v === "visible" ? "hidden" : "visible"));

  const toggle = () => {
    setFlipped((f) => {
      flip.set(f ? 0 : 180);
      return !f;
    });
  };

  const isSlab = slab && card.rarity === "legacy";
  const baseW = isSlab ? 340 : 300;
  const baseH = isSlab ? 530 : 420;

  const body = (
    <div className={`dc-card dc-${card.rarity}`}>
      <motion.div className="dc-inner" style={{ rotateY: flip }}>
        <motion.div className="dc-face-wrap" style={{ visibility: frontVis as MotionValue<string> }}>
          <Front card={card} uid={uid} countUp={countUp} />
        </motion.div>
        <motion.div className="dc-face-wrap dc-back-wrap" style={{ visibility: backVis as MotionValue<string> }}>
          <Back card={card} uid={uid} />
        </motion.div>
      </motion.div>
    </div>
  );

  return (
    <div className="dc-wrap" style={{ width: baseW * scale, height: baseH * scale }}>
      <div className="dc-stage" style={{ width: baseW, height: baseH, transform: `scale(${scale})` }}>
        <motion.div
          className="dc-shadow"
          style={{ x: tilt.shadowX, y: tilt.shadowY, width: baseW * 0.8, left: baseW * 0.1 }}
          aria-hidden
        />
        <motion.div
          className={`dc-tilt ${flippable ? "is-flippable" : ""}`}
          style={
            {
              width: baseW,
              height: baseH,
              rotateX: tilt.rotateX,
              rotateY: tilt.rotateY,
              "--mx": tilt.glareX,
              "--my": tilt.glareY,
              "--pop": tilt.pop,
            } as unknown as CSSProperties
          }
          {...tilt.handlers}
          onClick={flippable ? toggle : undefined}
          role={flippable ? "button" : undefined}
          tabIndex={flippable ? 0 : undefined}
          aria-label={flippable ? `${card.name}'s card, ${card.overall} overall. Press to flip.` : `${card.name}'s card, ${card.overall} overall`}
          onKeyDown={(e) => {
            if (flippable && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              toggle();
            }
          }}
        >
          {isSlab ? (
            <div className="dc-slab">
              <div className="dc-slab-glass" />
              <Layer z={8} className="dc-slab-label">
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
              </Layer>
              <div className="dc-slab-window">
                <Layer z={14}>{body}</Layer>
              </div>
            </div>
          ) : (
            body
          )}
        </motion.div>
      </div>
    </div>
  );
}
