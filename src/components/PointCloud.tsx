"use client";

import { useEffect, useRef } from "react";
import { SHIELD_PATH } from "@/lib/theme";

type P = { x: number; y: number; z: number; sx: number; sy: number; sz: number; s: number; d: number };

/**
 * A rotating blue point cloud of a card: shield outline + body, the overall rating and name raised
 * in depth, and a ribbon spiralling around it. Points assemble from noise on load, follow the
 * pointer, and scatter where you hover.
 */
export function PointCloud({
  overall,
  name,
  className,
}: {
  overall: number;
  name: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Rasterise the card front offscreen and sample it into points.
    const W = 300, H = 420;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const o = off.getContext("2d", { willReadFrequently: true })!;
    const shield = new Path2D(SHIELD_PATH);
    o.fillStyle = "#000";
    o.fill(shield);
    const body = o.getImageData(0, 0, W, H).data;
    o.clearRect(0, 0, W, H);
    o.lineWidth = 3;
    o.stroke(shield);
    o.font = "700 96px 'Zilla Slab', Georgia, serif";
    o.textAlign = "center";
    o.fillText(String(overall), 110, 150);
    o.font = "600 30px 'IBM Plex Mono', monospace";
    o.fillText(name.toUpperCase().slice(0, 14), 150, 250);
    o.fillRect(70, 280, 160, 3);
    for (let i = 0; i < 6; i++) o.fillRect(70 + (i % 2) * 90, 300 + Math.floor(i / 2) * 22, 70, 6);
    o.beginPath();
    o.arc(200, 110, 52, 0, Math.PI * 2);
    o.stroke();
    const raised = o.getImageData(0, 0, W, H).data;

    const pts: P[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const push = (x: number, y: number, z: number, s: number) =>
      pts.push({ x, y, z, s, sx: rnd(-420, 420), sy: rnd(-420, 420), sz: rnd(-420, 420), d: Math.random() * 0.5 });
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 4) {
        const i = (y * W + x) * 4 + 3;
        if (raised[i] > 40) {
          push(x - W / 2, y - H / 2, -16 - Math.random() * 4, 1.7);
        } else if (body[i] > 40 && Math.random() < 0.22) {
          push(x - W / 2 + rnd(-1, 1), y - H / 2 + rnd(-1, 1), rnd(-4, 4), 1.1);
        }
      }
    }
    // ribbon spiralling around the card
    for (let t = 0; t < 1; t += 0.0016) {
      const a = t * Math.PI * 5;
      const r = 210 + Math.sin(t * Math.PI * 3) * 40;
      for (let k = 0; k < 3; k++) {
        const w = rnd(-14, 14);
        push(Math.cos(a) * r + w, (t - 0.5) * 520 + rnd(-6, 6), Math.sin(a) * r * 0.55 + w, 0.9);
      }
    }

    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: 0, y: 0, in: false, px: -9999, py: -9999 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.px = e.clientX - r.left;
      mouse.py = e.clientY - r.top;
      mouse.x = (mouse.px / r.width - 0.5) * 2;
      mouse.y = (mouse.py / r.height - 0.5) * 2;
      mouse.in = true;
    };
    const onLeave = () => {
      mouse.in = false;
      mouse.px = mouse.py = -9999;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    let rotY = -0.5, rotX = 0.12;
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      const targetY = mouse.in ? mouse.x * 0.9 : Math.sin(t * 0.25) * 0.55;
      const targetX = mouse.in ? -mouse.y * 0.35 : 0.12 + Math.sin(t * 0.18) * 0.05;
      rotY += (targetY - rotY) * 0.05;
      rotX += (targetX - rotX) * 0.05;
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
      const scale = Math.min(w / 560, h / 560);
      const cam = 900;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#2f3fc2";

      for (const p of pts) {
        const k = reduce ? 1 : ease(Math.max(0, Math.min(1, (t - p.d) / 1.6)));
        let x = p.sx + (p.x - p.sx) * k;
        let y = p.sy + (p.y - p.sy) * k;
        let z = p.sz + (p.z - p.sz) * k;
        // rotate Y then X
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y1 = y * cx - z1 * sx;
        const z2 = y * sx + z1 * cx;
        const f = cam / (cam + z2);
        let X = w / 2 + x1 * f * scale;
        let Y = h / 2 + y1 * f * scale;
        // scatter around the pointer
        const dx = X - mouse.px, dy = Y - mouse.py;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 4900) {
          const push = (1 - Math.sqrt(dist2) / 70) * 16;
          const n = Math.sqrt(dist2) || 1;
          X += (dx / n) * push;
          Y += (dy / n) * push;
        }
        const s = p.s * f * Math.max(0.6, scale);
        ctx.globalAlpha = Math.max(0.15, Math.min(1, 0.55 + (-z2 / 500)));
        ctx.fillRect(X, Y, s, s);
        x = y = z = 0;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [overall, name]);

  return <canvas ref={ref} className={className} style={{ width: "100%" }} aria-label={`Point cloud of a ${overall}-rated card`} role="img" />;
}
