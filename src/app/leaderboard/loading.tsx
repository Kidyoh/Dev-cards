import { Sheet } from "@/components/hud";

export default function Loading() {
  return (
    <Sheet tone="light" className="blueprint">
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
        <span className="size-2 animate-blink rounded-full bg-ink" />
        Scanning the league · first load can take a few seconds
      </div>
    </Sheet>
  );
}
