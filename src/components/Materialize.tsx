"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CardData } from "@/lib/types";
import { DevCard } from "./DevCard";
import { CardHud } from "./CardHud";

type Phase = "loading" | "scanning" | "resolving" | "live";

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The card "rezzes in": its rendered PNG is sampled into a dot cloud that assembles top-to-bottom
 * behind a scan line, then resolves from chunky pixels to sharp, then swaps to the live 3D card.
 */
export function Materialize({ card, hud = true }: { card: CardData; hud?: boolean }) {
  const reduce = useReducedMotion();
  const isSlab = card.rarity === "legacy";
  const W = isSlab ? 340 : 300;
  const H = isSlab ? 530 : 420;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [run, setRun] = useState(0);

  const finish = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setProgress(100);
    setPhase("live");
  }, []);

  useEffect(() => {
    if (reduce) {
      setPhase("live");
      return;
    }
    setPhase("loading");
    setProgress(0);
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.src = `/api/card/${encodeURIComponent(card.login)}/image?format=card`;
    imgRef.current = img;
    const fail = setTimeout(() => !cancelled && finish(), 6000); // never leave people staring at nothing

    img.onerror = () => !cancelled && finish();
    img.onload = () => {
      if (cancelled) return;
      clearTimeout(fail);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return finish();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sample the card into dots.
      const sample = document.createElement("canvas");
      const step = 5;
      sample.width = Math.ceil(W / step);
      sample.height = Math.ceil(H / step);
      const sctx = sample.getContext("2d", { willReadFrequently: true })!;
      sctx.drawImage(img, 0, 0, sample.width, sample.height);
      const data = sctx.getImageData(0, 0, sample.width, sample.height).data;
      const dots: { tx: number; ty: number; sx: number; sy: number; c: string; d: number }[] = [];
      for (let y = 0; y < sample.height; y++) {
        for (let x = 0; x < sample.width; x++) {
          const i = (y * sample.width + x) * 4;
          if (data[i + 3] < 60) continue;
          const tx = x * step, ty = y * step;
          const a = Math.random() * Math.PI * 2;
          const r = 60 + Math.random() * 180;
          dots.push({
            tx, ty,
            sx: W / 2 + Math.cos(a) * r * 1.4,
            sy: ty + Math.sin(a) * r * 0.5 - 40,
            c: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
            d: (ty / H) * 0.55 + Math.random() * 0.15,
          });
        }
      }

      setPhase("scanning");
      const scanMs = 1300;
      const levels = [28, 20, 14, 10, 7, 5, 3, 2];
      const levelMs = 80;
      const t0 = performance.now();
      const small = document.createElement("canvas");
      const smctx = small.getContext("2d")!;

      const frame = (now: number) => {
        if (cancelled) return;
        const t = now - t0;
        ctx.clearRect(0, 0, W, H);
        if (t < scanMs) {
          const p = t / scanMs;
          for (const dot of dots) {
            const k = Math.max(0, Math.min(1, (p - dot.d) / 0.35));
            if (k <= 0) continue;
            const e = ease(k);
            ctx.globalAlpha = 0.25 + 0.75 * e;
            ctx.fillStyle = dot.c;
            const size = 1.5 + 2.5 * e;
            ctx.fillRect(dot.sx + (dot.tx - dot.sx) * e, dot.sy + (dot.ty - dot.sy) * e, size, size);
          }
          ctx.globalAlpha = 1;
          // scan line
          const sy = Math.min(H, p * H * 1.25);
          const g = ctx.createLinearGradient(0, sy - 40, 0, sy);
          g.addColorStop(0, "rgba(212,245,60,0)");
          g.addColorStop(1, "rgba(212,245,60,0.55)");
          ctx.fillStyle = g;
          ctx.fillRect(0, sy - 40, W, 40);
          ctx.fillStyle = "#d4f53c";
          ctx.fillRect(0, sy - 1, W, 2);
          setProgress(Math.round(p * 70));
        } else {
          const li = Math.floor((t - scanMs) / levelMs);
          if (li >= levels.length) {
            ctx.drawImage(img, 0, 0, W, H);
            return finish();
          }
          setPhase("resolving");
          const block = levels[li];
          small.width = Math.ceil(W / block);
          small.height = Math.ceil(H / block);
          smctx.imageSmoothingEnabled = true;
          smctx.drawImage(img, 0, 0, small.width, small.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(small, 0, 0, small.width, small.height, 0, 0, small.width * block, small.height * block);
          setProgress(70 + Math.round(((li + 1) / levels.length) * 30));
        }
        rafRef.current = requestAnimationFrame(frame);
      };
      rafRef.current = requestAnimationFrame(frame);
    };

    return () => {
      cancelled = true;
      clearTimeout(fail);
      cancelAnimationFrame(rafRef.current);
    };
  }, [card.login, W, H, reduce, run, finish]);

  const status =
    phase === "loading" ? "Connecting" : phase === "scanning" ? "Scanning" : phase === "resolving" ? "Resolving" : "Scan complete";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between gap-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-mute" style={{ maxWidth: W }}>
        <span className="flex items-center gap-2">
          <span className={phase === "live" ? "size-1.5 rounded-full bg-lime ring-2 ring-ink" : "size-1.5 animate-blink rounded-full bg-orange"} />
          {status}
        </span>
        <span className="tabular-nums">{String(progress).padStart(3, "0")}%</span>
      </div>

      <CardHud card={card} show={hud && phase === "live"}>
        <div className="relative" style={{ width: W, height: H }}>
          {phase !== "live" && (
            <button
              type="button"
              onClick={finish}
              aria-label="Skip the scan"
              className="absolute inset-0 cursor-pointer rounded-2xl"
            >
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated" }} />
              {phase === "loading" && (
                <span className="absolute inset-0 grid place-items-center rounded-2xl border border-dashed border-ink/25 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
                  @{card.login}
                </span>
              )}
            </button>
          )}
          <AnimatePresence>
            {phase === "live" && (
              <motion.div
                key={`live-${run}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
              >
                <DevCard card={card} countUp />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardHud>

      <div className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-mute" style={{ maxWidth: W }}>
        <span>Tilt · tap to flip</span>
        <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            className="underline decoration-ink/30 underline-offset-4 hover:text-ink"
          >
            ↻ Rescan
          </button>
      </div>
    </div>
  );
}
