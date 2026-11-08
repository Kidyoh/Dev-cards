import type { Metadata } from "next";
import Link from "next/link";
import { Headline, Label } from "@/components/bp";
import { BoardList } from "@/components/BoardList";
import { ErrorBox } from "@/components/ErrorBox";
import { COUNTRIES, getBoard, STACKS, type Board } from "@/lib/cards";
import type { CardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Board" };

type Props = { searchParams: Promise<{ country?: string; stack?: string }> };

function Opt({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("border px-1.5 py-[1px] font-mono text-[10.5px] uppercase", active ? "border-blue bg-blue text-white" : "border-blue/40 text-blue hover:border-blue")}>
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
  const on = (kind: Board["kind"], v: string) => board.kind === kind && board.value.toLowerCase() === v.toLowerCase();

  return (
    <section className="px-4 pt-6 sm:px-6">
      <Label className="text-blue/60">Procedure · ranking</Label>
      <Headline className="mt-2 text-[clamp(44px,6.4vw,92px)]">The board.</Headline>
      <p className="mt-3 max-w-lg font-mono text-[11px] uppercase leading-relaxed text-blue">
        The 15 most-followed developers in a country or stack, ranked by card. Refreshed every 6 hours.
      </p>

      <div className="mt-8 grid gap-3 border border-blue bg-white p-3 md:grid-cols-[90px_1fr]">
        <Label className="pt-0.5">Country</Label>
        <div className="flex flex-wrap gap-1">
          {COUNTRIES.map((c) => <Opt key={c} href={`/leaderboard?country=${encodeURIComponent(c)}`} active={on("country", c)}>{c}</Opt>)}
        </div>
        <Label className="pt-0.5">Stack</Label>
        <div className="flex flex-wrap gap-1">
          {STACKS.map((s) => <Opt key={s} href={`/leaderboard?stack=${encodeURIComponent(s)}`} active={on("stack", s)}>{s}</Opt>)}
        </div>
      </div>

      <Headline as="h2" className="mt-12 text-[clamp(28px,3.4vw,44px)]">
        {board.kind === "country" ? `Top in ${board.value}` : `Top ${board.value}`}
      </Headline>
      {error ? <div className="mt-6"><ErrorBox error={error} /></div> : cards.length === 0 ? (
        <p className="mt-6 font-mono text-[11px] uppercase text-blue">Nobody here yet.</p>
      ) : (
        <BoardList cards={cards} />
      )}
    </section>
  );
}
