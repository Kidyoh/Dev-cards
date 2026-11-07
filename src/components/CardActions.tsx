"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addToBinder, inBinder, removeFromBinder } from "@/lib/binder";

export function CardActions({ login, overall, name, url }: { login: string; overall: number; name: string; url: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rival, setRival] = useState("");

  useEffect(() => setSaved(inBinder(login)), [login]);

  const tweet = `My dev card is rated ${overall} overall. What's yours?`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;

  return (
    <>
      <div className="actions">
        <a className="btn" href={xUrl} target="_blank" rel="noopener noreferrer">Share on X</a>
        <a className="btn ghost" href={`/api/card/${login}/image?format=card`} download={`${login}-dev-card.png`}>
          Download PNG
        </a>
        <button
          className="btn ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard can be blocked; ignore */
            }
          }}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            if (saved) removeFromBinder(login);
            else addToBinder(login);
            setSaved(!saved);
          }}
        >
          {saved ? "✓ In your binder" : "Add to binder"}
        </button>
      </div>
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          const r = rival.trim().replace(/^@/, "");
          if (r) router.push(`/compare?a=${encodeURIComponent(login)}&b=${encodeURIComponent(r)}`);
        }}
      >
        <input placeholder={`Compare ${name} with…`} value={rival} onChange={(e) => setRival(e.target.value)} aria-label="Username to compare with" />
        <button className="btn ghost">Compare</button>
      </form>
    </>
  );
}
