"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/leaderboard", label: "Leaderboards" },
  { href: "/compare", label: "Compare" },
  { href: "/binder", label: "Binder" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Dev Cards home">
      <span className="grid size-8 place-items-center rounded-lg bg-lime text-ink">
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
          <rect x="3" y="1.5" width="10" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display text-[17px] font-bold tracking-tight">
        DEV <span className="font-medium opacity-60">cards</span>
      </span>
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 px-2 pt-2 sm:px-3 sm:pt-3">
      <nav className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 rounded-full border border-ink/10 bg-sheet/80 px-3 pl-4 backdrop-blur-md">
        <Logo />
        <div className="ml-auto hidden items-center gap-7 text-sm md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("text-ink/60 transition-colors hover:text-ink", path.startsWith(l.href) && "text-ink")}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href="/#scan"
          className="ml-auto rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 md:ml-4"
        >
          Get your card
        </Link>
      </nav>
      <div className="mx-auto mt-2 flex max-w-[1400px] justify-center gap-5 font-mono text-[11px] uppercase tracking-[0.16em] md:hidden">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={cn("text-ink/55", path.startsWith(l.href) && "text-ink")}>
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
