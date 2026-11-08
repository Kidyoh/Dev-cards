"use client";

/**
 * Draws the collectible card into a PNG entirely in the browser (canvas), so downloads cost the
 * server nothing. Mirrors DevCard's layout (300×420 card, 340×530 slab for Legacy).
 */
import { RARITY, shieldSvg, sparklesSvg } from "./theme";
import type { CardData, StatKey } from "./types";

const FONT = '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif';

function loadImage(src: string, cors = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const svgSrc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Text with letter spacing (canvas letterSpacing isn't everywhere yet). */
function spaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = align;
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number, weight: number, size: number, min = 12) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(text).width > maxW && s > min) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
}

async function drawCardFace(ctx: CanvasRenderingContext2D, card: CardData, avatar: HTMLImageElement | null, scale: number) {
  const t = RARITY[card.rarity];
  const [art, sparkles] = await Promise.all([
    loadImage(svgSrc(shieldSvg(card.rarity, 300 * scale, 420 * scale))),
    loadImage(svgSrc(sparklesSvg(card.rarity, card.login, 300 * scale, 420 * scale))),
  ]);
  if (art) ctx.drawImage(art, 0, 0, 300, 420);

  // avatar
  const ax = 118, ay = 46, ad = 142;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.arc(ax + ad / 2, ay + ad / 2, ad / 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax + ad / 2, ay + ad / 2, ad / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    const s = Math.max(ad / avatar.width, ad / avatar.height);
    const w = avatar.width * s, h = avatar.height * s;
    ctx.drawImage(avatar, ax + (ad - w) / 2, ay + (ad - h) / 2, w, h);
  } else {
    ctx.fillStyle = t.text;
    ctx.font = `700 64px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(card.login.charAt(0).toUpperCase(), ax + ad / 2, ay + ad / 2 + 4);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(ax + ad / 2, ay + ad / 2, ad / 2 - 1.5, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = t.trim;
  ctx.stroke();

  ctx.fillStyle = t.text;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  // overall + role
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.font = `700 54px ${FONT}`;
  spaced(ctx, String(card.overall), 79, 96, -1.5);
  ctx.restore();
  ctx.font = `700 18px ${FONT}`;
  spaced(ctx, card.role.code, 79, 122, 1);
  // element
  ctx.font = `700 10px ${FONT}`;
  const el = card.element.name.toUpperCase();
  const ew = ctx.measureText(el).width + 12 + 0.5 * el.length;
  ctx.beginPath();
  ctx.arc(79 - ew / 2 + 4, 146.5, 4, 0, Math.PI * 2);
  ctx.fillStyle = card.element.color;
  ctx.fill();
  ctx.fillStyle = t.text;
  spaced(ctx, el, 79 + 6, 150, 0.5);
  if (card.languages[0]) {
    ctx.globalAlpha = 0.75;
    ctx.font = `400 10px ${FONT}`;
    ctx.fillText(card.languages[0].name, 79, 166);
    ctx.globalAlpha = 1;
  }
  // name
  const name = card.name.toUpperCase();
  fit(ctx, name, 220, 700, 21, 13);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  spaced(ctx, name, 150, 223, 0.4);
  ctx.restore();
  // rules
  ctx.fillStyle = t.line;
  ctx.fillRect(70, 234, 160, 1);
  ctx.fillRect(149.5, 248, 1, 80);
  // stats
  ctx.fillStyle = t.text;
  const cols: StatKey[][] = [["SHP", "CON", "RNG"], ["DEP", "IMP", "COL"]];
  cols.forEach((col, ci) => {
    const numRight = ci === 0 ? 102 : 188;
    col.forEach((k, ri) => {
      const y = 266 + ri * 26;
      ctx.textAlign = "right";
      ctx.font = `700 20px ${FONT}`;
      ctx.fillText(String(card.stats[k]), numRight, y);
      ctx.textAlign = "left";
      ctx.font = `500 20px ${FONT}`;
      ctx.fillText(k, numRight + 7, y);
    });
  });
  // ability + login
  ctx.textAlign = "center";
  ctx.fillStyle = t.sub;
  ctx.font = `700 11px ${FONT}`;
  spaced(ctx, `✦ ${(card.abilities[0]?.name ?? "").toUpperCase()}`, 150, 352, 0.9);
  ctx.globalAlpha = 0.8;
  ctx.font = `400 11px ${FONT}`;
  ctx.fillText(`@${card.login}`, 150, 370);
  ctx.globalAlpha = 1;

  if (sparkles) ctx.drawImage(sparkles, 0, 0, 300, 420);
}

function drawSlab(ctx: CanvasRenderingContext2D, card: CardData) {
  const g = ctx.createLinearGradient(0, 0, 340, 530);
  g.addColorStop(0, "rgba(215,235,238,0.95)");
  g.addColorStop(0.45, "rgba(160,190,195,0.9)");
  g.addColorStop(1, "rgba(225,240,242,0.95)");
  roundRect(ctx, 0, 0, 340, 530, 18);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.stroke();
  roundRect(ctx, 6, 6, 328, 518, 14);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(160,195,198,0.35)";
  ctx.stroke();
  // label
  roundRect(ctx, 12, 12, 316, 76, 8);
  const lg = ctx.createLinearGradient(0, 12, 0, 88);
  lg.addColorStop(0, "#ffffff");
  lg.addColorStop(1, "#f3f1ea");
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#b8913a";
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = "#222";
  fit(ctx, card.name.toUpperCase(), 210, 700, 14, 10);
  ctx.fillText(card.name.toUpperCase(), 28, 38);
  ctx.font = `400 11px ${FONT}`;
  ctx.fillText(`${(card.languages[0]?.name ?? "Developer").toUpperCase()} · ${card.role.name.toUpperCase()}`, 28, 54);
  ctx.fillStyle = "#7a6326";
  ctx.font = `500 8px ${FONT}`;
  ctx.fillText("SPECSHEET · LEGACY", 28, 74);
  ctx.textAlign = "center";
  ctx.font = `500 8px ${FONT}`;
  ctx.fillText("GRADE", 290, 40);
  ctx.fillStyle = "#3a2e12";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText((card.overall / 10).toFixed(1), 290, 68);
  // window
  roundRect(ctx, 10, 100, 320, 420, 10);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.stroke();
}

/** Render the card (with a soft floor shadow, transparent background) and return a PNG blob. */
export async function renderCardPng(card: CardData, scale = 2): Promise<Blob> {
  const slab = card.rarity === "legacy";
  const cw = slab ? 340 : 300, ch = slab ? 530 : 420;
  const pad = 36;
  const W = cw + pad * 2, H = ch + pad * 2;

  await Promise.all(
    ["400", "500", "700"].map((w) => document.fonts.load(`${w} 20px "IBM Plex Sans"`).catch(() => null)),
  );
  const avatar = await loadImage(card.avatarUrl, true);

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // floor shadow
  const sg = ctx.createRadialGradient(W / 2, pad + ch - 4, 0, W / 2, pad + ch - 4, cw * 0.42);
  sg.addColorStop(0, "rgba(0,0,0,0.35)");
  sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.translate(0, pad + ch - 4);
  ctx.scale(1, 0.18);
  ctx.translate(0, -(pad + ch - 4));
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H * 2);
  ctx.restore();

  ctx.save();
  ctx.translate(pad, pad);
  if (slab) {
    drawSlab(ctx, card);
    ctx.translate(20, 100);
  }
  await drawCardFace(ctx, card, avatar, scale);
  ctx.restore();

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}
