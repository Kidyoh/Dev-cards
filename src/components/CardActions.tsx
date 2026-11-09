"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addToBinder, inBinder, removeFromBinder } from "@/lib/binder";
import { renderCardPng } from "@/lib/cardCanvas";
import { imageUrl, shareUrl } from "@/lib/api";
import type { CardData } from "@/lib/types";

const btn = "border border-blue px-2 py-1 font-mono text-[10.5px] font-semibold uppercase text-blue hover:bg-blue hover:text-white";

export function CardActions({ card }: { card: CardData }) {
  const { login, overall } = card;
  // Share links go through the API so X/Telegram show the card preview; people land on the card page.
  const url = shareUrl(login);
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rival, setRival] = useState("");
  const [dl, setDl] = useState<"idle" | "busy" | "error">("idle");
  useEffect(() => setSaved(inBinder(login)), [login]);

  // Warm the X/Telegram preview image so it's ready before anyone shares the link. A plain image
  // load (not fetch) needs no CORS; retry a couple of times if the render hits the CPU limit.
  useEffect(() => {
    let tries = 0;
    let stop = false;
    const warm = () => {
      if (stop || tries++ >= 3) return;
      const img = new Image();
      img.onerror = () => setTimeout(warm, 1500 * tries);
      img.src = `${imageUrl(login, "og")}&w=${tries}`;
    };
    const t = setTimeout(warm, 1500);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [login]);

  // The PNG is drawn in the browser (canvas): instant, and no server CPU.
  async function download() {
    if (dl === "busy") return;
    setDl("busy");
    try {
      const blob = await renderCardPng(card);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${login}-specsheet-card.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
      setDl("idle");
    } catch {
      setDl("error");
    }
  }

  const tweet = `My dev card is rated ${overall} overall. What's yours?`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <a className={`${btn} bg-blue text-white hover:bg-blue-deep`} href={xUrl} target="_blank" rel="noopener noreferrer">Share on X ↗</a>
        <button className={btn} onClick={download} disabled={dl === "busy"}>
          {dl === "busy" ? "Drawing…" : dl === "error" ? "Retry download" : "Download card"}
        </button>
        <button
          className={btn}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* blocked */
            }
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          className={btn}
          onClick={() => {
            if (saved) removeFromBinder(login);
            else addToBinder(login);
            setSaved(!saved);
          }}
        >
          {saved ? "✓ In binder" : "+ Binder"}
        </button>
      </div>
      <form
        className="flex border border-blue bg-white"
        onSubmit={(e) => {
          e.preventDefault();
          const r = rival.trim().replace(/^@/, "");
          if (r) router.push(`/compare?a=${encodeURIComponent(login)}&b=${encodeURIComponent(r)}`);
        }}
      >
        <span className="grid place-items-center border-r border-blue px-1.5 font-mono text-[10px] text-blue">VS</span>
        <input
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-[12px] outline-none placeholder:text-blue/40"
          placeholder="rival username"
          value={rival}
          onChange={(e) => setRival(e.target.value)}
          aria-label="Username to compare with"
        />
        <button type="submit" className="bg-blue px-3 font-mono text-[11px] font-semibold uppercase text-white hover:bg-blue-deep">Go →</button>
      </form>
    </div>
  );
}
