import type { Metadata } from "next";
import { Headline, Label } from "@/components/bp";
import { ErrorBox } from "@/components/ErrorBox";
import { Versus } from "@/components/Versus";
import { getCard } from "@/lib/cards";
import type { CardData } from "@/lib/types";

export const metadata: Metadata = { title: "Versus" };

type Props = { searchParams: Promise<{ a?: string; b?: string }> };

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
  const field = "min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-[12px] outline-none placeholder:text-blue/40";

  return (
    <section className="px-4 pt-6 sm:px-6">
      <Label className="text-blue/60">Procedure · comparison</Label>
      <Headline className="mt-2 text-[clamp(44px,6.4vw,92px)]">Subject A<br />vs subject B.</Headline>
      <form action="/compare" className="mt-6 flex max-w-[620px] flex-wrap border border-blue bg-white sm:flex-nowrap">
        <span className="grid place-items-center border-r border-blue bg-blue px-2 font-mono text-[10px] font-semibold text-white">A</span>
        <input name="a" defaultValue={a} placeholder="username" aria-label="First username" className={field} />
        <span className="grid place-items-center border-x border-blue bg-blue px-2 font-mono text-[10px] font-semibold text-white">B</span>
        <input name="b" defaultValue={b} placeholder="username" aria-label="Second username" className={field} />
        <button className="w-full bg-blue px-4 py-1.5 font-mono text-[11px] font-semibold uppercase text-white hover:bg-blue-deep sm:w-auto">Compare →</button>
      </form>
      {error ? <div className="mt-6 max-w-[620px]"><ErrorBox error={error} /></div> : null}
      {pair && <Versus left={pair[0]} right={pair[1]} />}
    </section>
  );
}
