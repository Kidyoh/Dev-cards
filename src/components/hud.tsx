"use client";

import { motion, useInView } from "motion/react";
import { useMemo, useRef, type ReactNode } from "react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   Layout: big rounded "sheets" on a paper background, alternating light and ink.
--------------------------------------------------------------------------------------------- */
export function Sheet({
  children,
  tone = "light",
  className,
  inner,
  id,
  backdrop,
}: {
  children: ReactNode;
  /** full-bleed decoration behind the content (grids, dot fields) */
  backdrop?: ReactNode;
  tone?: "light" | "dark" | "paper";
  className?: string;
  inner?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative mx-2 overflow-hidden rounded-[28px] sm:mx-3 sm:rounded-[32px]",
        tone === "dark" && "bg-ink text-[#f6f6f1]",
        tone === "light" && "bg-sheet",
        tone === "paper" && "bg-sheet-2",
        className,
      )}
    >
      {backdrop && <div aria-hidden className="pointer-events-none absolute inset-0">{backdrop}</div>}
      <div className={cn("relative mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-8 md:py-24", inner)}>{children}</div>
    </section>
  );
}

/** "01 · THE LINEUP" style section label, decoded from gibberish on first view. */
export function Eyebrow({ children, className, decode = true }: { children: string; className?: string; decode?: boolean }) {
  return (
    <p className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.28em] opacity-70", className)}>
      {decode ? <EncryptedText text={children} revealDelayMs={22} flipDelayMs={40} /> : children}
    </p>
  );
}

/** [ CORE STATS ] bracket label. */
export function Bracket({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.2em]", className)}>
      [ {children} ]
    </span>
  );
}

/** A small "window" panel with a title bar, like the HUD readouts in the reference. */
export function HudPanel({
  title,
  meta,
  children,
  tone = "light",
  className,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border font-mono text-[11px]",
        tone === "light" ? "border-ink bg-sheet text-ink" : "border-[#f6f6f1]/70 bg-ink-2 text-[#f6f6f1]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em]",
          tone === "light" ? "bg-ink text-sheet" : "bg-[#f6f6f1] text-ink",
        )}
      >
        <span className="truncate">{title}</span>
        <span className="flex items-center gap-2 opacity-80">
          {meta}
          <span aria-hidden>×</span>
        </span>
      </div>
      <div className="p-3 leading-relaxed">{children}</div>
    </div>
  );
}

/** Deterministic barcode from a string. */
export function Barcode({ value, className, height = 22 }: { value: string; className?: string; height?: number }) {
  const bars = useMemo(() => {
    let h = 2166136261;
    const out: { x: number; w: number }[] = [];
    let x = 0;
    for (let i = 0; i < 46; i++) {
      h = Math.imul(h ^ value.charCodeAt(i % value.length || 0), 16777619) >>> 0;
      const w = 1 + (h % 3);
      if (i % 2 === 0) out.push({ x, w });
      x += w + 1;
    }
    return { out, width: x };
  }, [value]);
  return (
    <svg viewBox={`0 0 ${bars.width} ${height}`} className={cn("h-[22px] w-auto", className)} aria-hidden preserveAspectRatio="none">
      {bars.out.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Blinking status dot used in pills ("● LIVE"). */
export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block size-1.5 rounded-full bg-lime", className)} />;
}

/* ---------------------------------------------------------------------------------------------
   Pixel motion
--------------------------------------------------------------------------------------------- */

/**
 * Covers its children with a grid of solid squares that blink out in random order when the
 * element scrolls into view, so content "rezzes in" pixel by pixel.
 */
export function PixelReveal({
  children,
  cols = 14,
  rows = 6,
  color = "var(--color-sheet)",
  className,
  duration = 700,
  delay = 0,
}: {
  children: ReactNode;
  cols?: number;
  rows?: number;
  color?: string;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const cells = useMemo(() => {
    let seed = cols * 31 + rows * 17;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: cols * rows }, () => delay + Math.round(rnd() * duration));
  }, [cols, rows, duration, delay]);
  return (
    <div ref={ref} className={cn("relative", inView && "px-on", className)}>
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {cells.map((d, i) => (
          <span key={i} className="px-cell" style={{ background: color, ["--d" as string]: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
}

/** A stat bar made of discrete pixel segments that fill one by one. */
export function SegBar({
  value,
  segments = 25,
  color = "var(--color-ink)",
  track = "rgb(18 19 17 / 0.1)",
  delay = 0,
  className,
}: {
  value: number;
  segments?: number;
  color?: string;
  track?: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const on = Math.round((value / 100) * segments);
  return (
    <div ref={ref} className={cn("flex h-2.5 gap-[2px]", className)} aria-hidden>
      {Array.from({ length: segments }, (_, i) => (
        <motion.span
          key={i}
          className="h-full flex-1 rounded-[1px]"
          initial={{ backgroundColor: track }}
          animate={inView && i < on ? { backgroundColor: color } : { backgroundColor: track }}
          transition={{ duration: 0, delay: delay + i * 0.028 }}
        />
      ))}
    </div>
  );
}

/** Decoding text for short labels and numbers. */
export function Decode({ text, className, speed = 30 }: { text: string; className?: string; speed?: number }) {
  return <EncryptedText text={text} className={className} revealDelayMs={speed} flipDelayMs={35} />;
}
