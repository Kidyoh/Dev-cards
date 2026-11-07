"use client";

import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; spin: number; rot: number; kind: 0 | 1 };

/**
 * Canvas confetti + sparks fired from the centre whenever `fire` changes to a new truthy value.
 * Absolutely positioned; give the parent position: relative.
 */
export function Burst({ fire, colors, count = 60, spread = 1, className }: { fire: number; colors: string[]; count?: number; spread?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fire) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const ps: P[] = Array.from({ length: count }, () => {
      const a = Math.random() * Math.PI * 2;
      const sp = (4 + Math.random() * 9) * spread;
      return {
        x: w / 2, y: h / 2,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
        life: 0, max: 60 + Math.random() * 50,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        spin: (Math.random() - 0.5) * 0.4, rot: Math.random() * 6,
        kind: Math.random() < 0.6 ? 0 : 1,
      };
    });

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of ps) {
        if (p.life > p.max) continue;
        alive++;
        p.life++;
        p.vx *= 0.97;
        p.vy = p.vy * 0.97 + 0.22;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        const a = 1 - p.life / p.max;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.kind === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          const s = p.size * 0.9;
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire]); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={ref} className={className ?? "fx-burst"} aria-hidden />;
}
