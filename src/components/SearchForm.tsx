"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchForm({ placeholder = "GitHub username", cta = "Get my card" }: { placeholder?: string; cta?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        const u = value.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//i, "").split("/")[0];
        if (!u) return;
        setBusy(true);
        router.push(`/u/${encodeURIComponent(u)}`);
      }}
    >
      <input
        aria-label="GitHub username"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <button className="btn" disabled={busy}>{busy ? "Pulling stats…" : cta}</button>
    </form>
  );
}
