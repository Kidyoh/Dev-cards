import type { Metadata } from "next";
import { ErrorBox } from "@/components/ErrorBox";
import { Faceoff } from "@/components/Faceoff";
import { Eyebrow, Sheet } from "@/components/hud";
import { getCard } from "@/lib/cards";
import type { CardData } from "@/lib/types";

export const metadata: Metadata = { title: "Compare" };

type Props = { searchParams: Promise<{ a?: string; b?: string }> };

function Picker({ a, b }: { a?: string; b?: string }) {
  const field = "min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-ink/30";
  return (
    <form action="/compare" className="mt-8 flex max-w-[640px] flex-wrap items-center gap-1 rounded-[28px] border border-ink/15 bg-white p-1.5 sm:flex-nowrap sm:rounded-full">
      <span className="ml-2 grid size-7 shrink-0 place-items-center rounded-md bg-lime font-mono text-[10px] font-bold">P1</span>
      <input name="a" defaultValue={a} placeholder="username" aria-label="First username" className={field} />
      <span className="ml-2 grid size-7 shrink-0 place-items-center rounded-md bg-orange font-mono text-[10px] font-bold">P2</span>
      <input name="b" defaultValue={b} placeholder="username" aria-label="Second username" className={field} />
      <button className="h-11 w-full shrink-0 rounded-full bg-ink px-6 text-sm font-semibold text-sheet sm:w-auto">Face off</button>
    </form>
  );
}

export default async function ComparePage({ searchParams }: Props) {
  const { a, b } = await searchParams;
  let pair: [CardData, CardData] | null = null;
  let error: unknown = null;
  if (a && b) {
    try {
      pair = await Promise.all([getCard(a), getCard(b)]);
    } catch (e) {
      error = e;
    }
  }

  return (
    <Sheet tone="light" className="blueprint">
      <Eyebrow>Head to head</Eyebrow>
      <h1 className="mt-4 text-[clamp(44px,7vw,96px)] font-bold leading-[0.9]">
        <span>Player one</span> <span className="align-middle text-[0.35em] font-medium text-mute">vs</span>{" "}
        <span className="text-ink/35">player two.</span>
      </h1>
      <Picker a={a} b={b} />
      {error ? <div className="mt-8"><ErrorBox error={error} /></div> : null}
      {pair && <Faceoff left={pair[0]} right={pair[1]} />}
    </Sheet>
  );
}
