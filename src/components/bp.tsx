"use client";

import { motion, useInView } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────── primitives ─────────────────────────────── */

/** Small mono label, uppercase, blue. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[10px] uppercase leading-tight tracking-[0.08em] text-blue", className)}>{children}</span>;
}

/** Filled tag, like the "SUTÉRA" chip in the reference. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-block bg-blue px-1.5 py-[1px] font-serif text-[13px] font-semibold uppercase leading-snug tracking-wide text-white", className)}>
      {children}
    </span>
  );
}

/** A HUD window: blue title bar, hairline frame. Opens in pixel steps when scrolled into view. */
export function Win({
  title,
  children,
  className,
  bodyClassName,
  delay = 0,
  icon = "×",
}: {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  delay?: number;
  icon?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <div
      ref={ref}
      className={cn("border border-blue bg-white", inView ? "win-open" : "opacity-0", className)}
      style={{ ["--wd" as string]: `${delay}ms` } as CSSProperties}
    >
      <div className="flex items-center justify-between bg-blue px-1.5 py-[2px] font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white">
        <span className="truncate">{title}</span>
        <span className="ml-2 grid size-3 place-items-center border border-white/80 text-[8px] leading-none">{icon}</span>
      </div>
      <div className={cn("p-2.5", bodyClassName)}>{children}</div>
    </div>
  );
}

/** [ CORE STATS ] heading. */
export function Bracket({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-blue", className)}>[{children}]</div>;
}

/** A row in a bracket list: index, label and a dithered pixel fill proportional to `value`. */
export function ThreadRow({ index, code, label, value }: { index: string; code: string; label: string; value: number }) {
  return (
    <div className="grid grid-cols-[1fr_110px] items-end gap-3 border-b border-blue/25 py-1.5">
      <div className="min-w-0">
        <div className="font-mono text-[9px] text-blue/70">{index}.({code})</div>
        <div className="truncate font-mono text-[11px] font-semibold uppercase text-blue">{label}</div>
      </div>
      <DitherBar value={value} />
    </div>
  );
}

/** Dithered bar: a pixel-dot fill that "prints" left to right. */
export function DitherBar({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className={cn("relative h-2.5 border border-blue/40", className)}>
      <motion.div
        className="dither absolute inset-y-0 left-0"
        initial={{ width: 0 }}
        animate={inView ? { width: `${value}%` } : {}}
        transition={{ duration: 0.9, ease: "linear" }}
        style={{ clipPath: "inset(0)" }}
      />
    </div>
  );
}

/** Horizontal meter of square cells (STRENGTH AND INTENSITY). Cells switch on one by one. */
export function Cells({ value, count = 20, className, delay = 0 }: { value: number; count?: number; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const on = Math.round((value / 100) * count);
  return (
    <div ref={ref} className={cn("flex h-3 gap-[2px]", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className="flex-1 border border-blue"
          initial={{ backgroundColor: "rgba(47,63,194,0)" }}
          animate={inView && i < on ? { backgroundColor: "rgba(47,63,194,1)" } : {}}
          transition={{ duration: 0, delay: delay + i * 0.03 }}
        />
      ))}
    </div>
  );
}

/** Vertical meters (the OVERALL panel). */
export function VMeters({ values, labels, height = 70 }: { values: number[]; labels: string[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex items-end gap-2">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="relative w-3 border border-blue" style={{ height }}>
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-blue"
              initial={{ height: 0 }}
              animate={inView ? { height: `${v}%` } : {}}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.2, 0, 0, 1] }}
            />
          </div>
          <span className="font-mono text-[8px] text-blue">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/** Tiny sparkline from contribution data (or any series). */
export function Spark({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(1, ...data);
  const pts = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * 100},${30 - (d / max) * 28}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      {[0, 25, 50, 75, 100].map((x) => (
        <line key={x} x1={x} x2={x} y1={0} y2={30} stroke="currentColor" strokeOpacity={0.15} strokeWidth={0.5} />
      ))}
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Deterministic barcode. */
export function Barcode({ value, className }: { value: string; className?: string }) {
  const bars = useMemo(() => {
    let h = 2166136261;
    const out: { x: number; w: number }[] = [];
    let x = 0;
    for (let i = 0; i < 40; i++) {
      h = Math.imul(h ^ value.charCodeAt(i % Math.max(1, value.length)), 16777619) >>> 0;
      const w = 1 + (h % 3);
      if (i % 2 === 0) out.push({ x, w });
      x += w + 1;
    }
    return { out, width: x };
  }, [value]);
  return (
    <svg viewBox={`0 0 ${bars.width} 20`} preserveAspectRatio="none" className={cn("h-5 w-24 text-blue", className)} aria-hidden>
      {bars.out.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={20} fill="currentColor" />)}
    </svg>
  );
}

/** Wireframe globe (under the "change reality" button in the reference). */
export function Globe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6 text-blue", className)} fill="none" stroke="currentColor" strokeWidth={0.9} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4.5" ry="10" />
      <path d="M2 12h20M3.5 7h17M3.5 17h17" />
    </svg>
  );
}

/** Ruler along the bottom of a frame: 0 · 10 · 20 … with ticks. */
export function Axis({ from = 0, to = 99, step = 10, unit = "", className }: { from?: number; to?: number; step?: number; unit?: string; className?: string }) {
  const marks: number[] = [];
  for (let v = from; v <= to; v += step) marks.push(v);
  return (
    <div className={cn("relative h-6 border-t border-blue/40", className)} aria-hidden>
      {marks.map((m) => {
        const left = ((m - from) / (to - from)) * 100;
        return (
          <span key={m} className="absolute top-0 -translate-x-1/2 font-mono text-[9px] text-blue/70" style={{ left: `${left}%` }}>
            <span className="mx-auto block h-1.5 w-px bg-blue/50" />
            {m}{unit}
          </span>
        );
      })}
    </div>
  );
}

/** Live local clock: "LOCAL TIME / ZUR 05:04 AM". */
export function LocalTime() {
  const [now, setNow] = useState<string | null>(null);
  const [zone, setZone] = useState("");
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    setZone((tz.split("/").pop() ?? "").slice(0, 3).toUpperCase());
    const tick = () => setNow(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-right font-mono text-[10px] uppercase leading-tight text-blue">
      <div className="text-blue/60">Local time</div>
      <div className="font-semibold">{zone} {now ?? "--:--"}</div>
    </div>
  );
}

/* ─────────────────────────────── page chrome ─────────────────────────────── */

const LINKS = [
  { href: "/", label: "Scan" },
  { href: "/leaderboard", label: "Board" },
  { href: "/compare", label: "Versus" },
  { href: "/binder", label: "Binder" },
];

/** Top bar of every page: brand tag, center control + globe, local time. */
export function TopBar({ center }: { center?: ReactNode }) {
  const path = usePathname();
  return (
    <header className="relative z-20 grid grid-cols-[1fr_auto_1fr] items-start gap-4 px-4 pt-4 sm:px-6">
      <div className="flex flex-col gap-2">
        <Link href="/" aria-label="Dev Cards home"><Tag>Dev Cards</Tag></Link>
        <nav className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase text-blue">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={cn("hover:underline", active && "bg-blue px-1 text-white hover:no-underline")}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col items-center gap-2">
        {center ?? (
          <Link href="/#scan" className="border border-blue px-2 py-[1px] font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-blue hover:bg-blue hover:text-white">
            Scan a developer
          </Link>
        )}
        <Globe />
      </div>
      <div className="flex justify-end"><LocalTime /></div>
    </header>
  );
}

/** Serif display headline in the reference's style. */
export function Headline({ children, className, as: Tag = "h1" }: { children: ReactNode; className?: string; as?: "h1" | "h2" }) {
  return (
    <Tag className={cn("font-serif font-light uppercase tracking-[-0.01em] text-blue", className)} style={{ lineHeight: 0.92 }}>
      {children}
    </Tag>
  );
}
