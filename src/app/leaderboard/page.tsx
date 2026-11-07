import type { Metadata } from "next";
import Link from "next/link";
import { ErrorBox } from "@/components/ErrorBox";
import { Eyebrow, Sheet } from "@/components/hud";
import { LeaderboardView } from "@/components/LeaderboardView";
import { COUNTRIES, getBoard, STACKS, type Board } from "@/lib/cards";
import type { CardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboards" };

type Props = { searchParams: Promise<{ country?: string; stack?: string }> };

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active ? "border-ink bg-ink text-lime" : "border-ink/15 bg-white text-ink/70 hover:border-ink/40 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const board: Board = sp.stack ? { kind: "stack", value: sp.stack } : { kind: "country", value: sp.country ?? "Nigeria" };

  let cards: CardData[] = [];
  let error: unknown = null;
  try {
    cards = await getBoard(board);
  } catch (e) {
    error = e;
  }
  const isActive = (kind: Board["kind"], v: string) => board.kind === kind && board.value.toLowerCase() === v.toLowerCase();

  return (
    <Sheet tone="light" className="blueprint">
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
        <div>
          <Eyebrow>The lineup</Eyebrow>
          <h1 className="mt-4 text-[clamp(44px,7vw,96px)] font-bold leading-[0.9]">
            Who&apos;s on <span className="text-ink/35">top?</span>
          </h1>
        </div>
        <p className="text-lg leading-relaxed text-mute md:pb-3">
          The 15 most-followed developers in a country or stack, ranked by card. Refreshed every 6 hours.
        </p>
      </div>

      <div className="mt-12 grid gap-6 rounded-3xl border border-line bg-sheet-2/60 p-5 md:grid-cols-[110px_1fr]">
        <span className="pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Country</span>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => (
            <Chip key={c} href={`/leaderboard?country=${encodeURIComponent(c)}`} active={isActive("country", c)}>{c}</Chip>
          ))}
        </div>
        <span className="pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Stack</span>
        <div className="flex flex-wrap gap-2">
          {STACKS.map((s) => (
            <Chip key={s} href={`/leaderboard?stack=${encodeURIComponent(s)}`} active={isActive("stack", s)}>{s}</Chip>
          ))}
        </div>
      </div>

      <h2 className="mt-16 text-3xl font-bold">
        {board.kind === "country" ? `Top developers in ${board.value}` : `Top ${board.value} developers`}
      </h2>
      {error ? (
        <div className="mt-6"><ErrorBox error={error} /></div>
      ) : cards.length === 0 ? (
        <p className="mt-6 text-mute">Nobody here yet.</p>
      ) : (
        <LeaderboardView cards={cards} boardKey={`${board.kind}:${board.value}`} />
      )}
    </Sheet>
  );
}
