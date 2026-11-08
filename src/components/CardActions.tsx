"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addToBinder, inBinder, removeFromBinder } from "@/lib/binder";
import { fetchRetry } from "@/lib/fetchRetry";

const btn = "border border-blue px-2 py-1 font-mono text-[10.5px] font-semibold uppercase text-blue hover:bg-blue hover:text-white";

export function CardActions({ login, overall, url }: { login: string; overall: number; url: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rival, setRival] = useState("");
  const [dl, setDl] = useState<"idle" | "busy" | "error">("idle");
  useEffect(() => setSaved(inBinder(login)), [login]);

  // Warm the edge cache for the poster and the X preview so they're ready before anyone shares.
  useEffect(() => {
    const t = setTimeout(() => {
      fetchRetry(`/api/card/${login}/image?format=og`).catch(() => {});
      fetchRetry(`/api/card/${login}/image?format=card`).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [login]);

  const cardUrl = `/api/card/${login}/image?format=card`;
  const sheetUrl = `/api/card/${login}/image?format=sheet`;
  async function download(e: React.MouseEvent<HTMLAnchorElement>, url: string, name: string) {
    e.preventDefault();
    if (dl === "busy") return;
    setDl("busy");
    try {
      const res = await fetchRetry(url);
      if (!res.ok) throw new Error(String(res.status));
      const href = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = href;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 5000);
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
        <a className={btn} href={cardUrl} download={`${login}-card.png`} onClick={(e) => download(e, cardUrl, `${login}-card.png`)}>
          {dl === "busy" ? "Rendering…" : dl === "error" ? "Retry PNG" : "Download card"}
        </a>
        <a className={btn} href={sheetUrl} download={`${login}-specsheet.png`} onClick={(e) => download(e, sheetUrl, `${login}-specsheet.png`)}>
          Spec sheet
        </a>
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
