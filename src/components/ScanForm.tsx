"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScanForm({ tone = "dark", cta = "Scan my GitHub", className }: { tone?: "dark" | "light"; cta?: string; className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={cn(
        "flex w-full max-w-[520px] items-center gap-1 rounded-full border p-1.5 pl-5",
        tone === "dark" ? "border-white/15 bg-white/[0.06]" : "border-ink/15 bg-white",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        const u = value.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//i, "").split("/")[0];
        if (!u) return;
        setBusy(true);
        router.push(`/u/${encodeURIComponent(u)}`);
      }}
    >
      <span className={cn("font-mono text-sm", tone === "dark" ? "text-white/45" : "text-mute")}>github.com/</span>
      <input
        aria-label="GitHub username"
        placeholder="username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn(
          "min-w-0 flex-1 bg-transparent py-2 font-mono text-sm outline-none",
          tone === "dark" ? "text-white placeholder:text-white/30" : "text-ink placeholder:text-ink/30",
        )}
      />
      <Button type="submit" disabled={busy} className="h-11 rounded-full bg-lime px-5 font-semibold text-ink hover:bg-lime-2">
        {busy ? "Scanning…" : cta}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
