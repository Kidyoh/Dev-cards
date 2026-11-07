"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAMES = ["torvalds", "gaearon", "sindresorhus", "yyx990803", "your-username", "antfu"];

/** Search box with a typewriter placeholder and an animated conic border. */
export function TypingSearch({ cta = "Rip my pack" }: { cta?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [ph, setPh] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let i = 0, j = 0, del = false;
    const id = setInterval(() => {
      const w = NAMES[i % NAMES.length];
      if (!del) {
        j++;
        if (j > w.length + 8) del = true;
      } else {
        j--;
        if (j <= 0) { del = false; i++; }
      }
      setPh(w.slice(0, Math.max(0, Math.min(j, w.length))));
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <form
      className="search-hero"
      onSubmit={(e) => {
        e.preventDefault();
        const u = value.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//i, "").split("/")[0];
        if (!u) return;
        setBusy(true);
        router.push(`/u/${encodeURIComponent(u)}`);
      }}
    >
      <span className="search-at">github.com/</span>
      <input
        aria-label="GitHub username"
        placeholder={ph || " "}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <button className="btn btn-shine" disabled={busy}>{busy ? "Opening…" : cta}</button>
    </form>
  );
}
