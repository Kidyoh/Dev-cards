import type { Metadata } from "next";
import { ErrorBox } from "@/components/ErrorBox";
import { Faceoff } from "@/components/Faceoff";
import { getCard } from "@/lib/cards";
import type { CardData } from "@/lib/types";

export const metadata: Metadata = { title: "Compare" };

type Props = { searchParams: Promise<{ a?: string; b?: string }> };

function Picker({ a, b }: { a?: string; b?: string }) {
  return (
    <form action="/compare" className="search" style={{ maxWidth: 640 }}>
      <input name="a" defaultValue={a} placeholder="First username" aria-label="First username" className="input" />
      <input name="b" defaultValue={b} placeholder="Second username" aria-label="Second username" className="input" />
      <button className="btn">Face off</button>
    </form>
  );
}

export default async function ComparePage({ searchParams }: Props) {
  const { a, b } = await searchParams;
  if (!a || !b) {
    return (
      <>
        <h1>Head to head</h1>
        <p className="muted">Put two developers side by side, stat by stat.</p>
        <Picker a={a} b={b} />
      </>
    );
  }

  let left: CardData, right: CardData;
  try {
    [left, right] = await Promise.all([getCard(a), getCard(b)]);
  } catch (e) {
    return (
      <>
        <h1>Head to head</h1>
        <Picker a={a} b={b} />
        <div style={{ marginTop: 16 }}><ErrorBox error={e} /></div>
      </>
    );
  }

  return (
    <>
      <h1>Head to head</h1>
      <Picker a={a} b={b} />
      <Faceoff left={left} right={right} />
    </>
  );
}
