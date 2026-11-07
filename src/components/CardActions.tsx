"use client";

import { ArrowRight, Check, Download, Link2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addToBinder, inBinder, removeFromBinder } from "@/lib/binder";

export function CardActions({ login, overall, name, url }: { login: string; overall: number; name: string; url: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rival, setRival] = useState("");

  useEffect(() => setSaved(inBinder(login)), [login]);

  const tweet = `My dev card is rated ${overall} overall. What's yours?`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
  const pill = "h-11 rounded-full px-5 text-sm font-semibold";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild className={`${pill} bg-lime text-ink hover:bg-lime-2`}>
          <a href={xUrl} target="_blank" rel="noopener noreferrer">Share on X <ArrowRight className="size-4" /></a>
        </Button>
        <Button asChild className={`${pill} bg-ink text-sheet hover:bg-ink-3`}>
          <a href={`/api/card/${login}/image?format=card`} download={`${login}-dev-card.png`}><Download className="size-4" /> PNG</a>
        </Button>
        <Button
          variant="outline"
          className={`${pill} border-ink/15 bg-transparent hover:bg-white`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard can be blocked */
            }
          }}
        >
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />} {copied ? "Copied" : "Copy link"}
        </Button>
        <Button
          variant="outline"
          className={`${pill} border-ink/15 bg-transparent hover:bg-white`}
          onClick={() => {
            if (saved) removeFromBinder(login);
            else addToBinder(login);
            setSaved(!saved);
          }}
        >
          {saved ? <Check className="size-4" /> : <Plus className="size-4" />} {saved ? "In binder" : "Add to binder"}
        </Button>
      </div>
      <form
        className="flex max-w-[460px] items-center gap-1 rounded-full border border-ink/15 bg-white p-1.5 pl-5"
        onSubmit={(e) => {
          e.preventDefault();
          const r = rival.trim().replace(/^@/, "");
          if (r) router.push(`/compare?a=${encodeURIComponent(login)}&b=${encodeURIComponent(r)}`);
        }}
      >
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-mute">vs</span>
        <input
          className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-sm outline-none placeholder:text-ink/30"
          placeholder={`challenge ${name.toLowerCase().split(" ")[0]}…`}
          value={rival}
          onChange={(e) => setRival(e.target.value)}
          aria-label="Username to compare with"
        />
        <Button type="submit" className="h-9 rounded-full bg-ink px-4 text-sm text-sheet hover:bg-ink-3">Faceoff</Button>
      </form>
    </div>
  );
}
