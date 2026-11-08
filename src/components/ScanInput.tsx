"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ScanInput({ cta = "Scan →", placeholder = "github username" }: { cta?: string; placeholder?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex w-full border border-blue bg-white"
      onSubmit={(e) => {
        e.preventDefault();
        const u = value.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//i, "").split("/")[0];
        if (!u) return;
        setBusy(true);
        router.push(`/u/${encodeURIComponent(u)}`);
      }}
    >
      <span className="grid place-items-center border-r border-blue px-1.5 font-mono text-[10px] text-blue">@</span>
      <input
        aria-label="GitHub username"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-[12px] text-blue-deep outline-none placeholder:text-blue/40"
      />
      <button type="submit" disabled={busy} className="bg-blue px-3 font-mono text-[11px] font-semibold uppercase text-white hover:bg-blue-deep disabled:opacity-60">
        {busy ? <span className="animate-blink">▮</span> : cta}
      </button>
    </form>
  );
}
