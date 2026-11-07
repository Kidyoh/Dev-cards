import type { Metadata } from "next";
import { Binder } from "@/components/Binder";
import { Eyebrow, Sheet } from "@/components/hud";

export const metadata: Metadata = { title: "My binder" };

export default function BinderPage() {
  return (
    <Sheet tone="light" className="blueprint">
      <Eyebrow>Collection</Eyebrow>
      <h1 className="mt-4 text-[clamp(44px,7vw,96px)] font-bold leading-[0.9]">
        My <span className="text-ink/35">binder.</span>
      </h1>
      <p className="mt-5 max-w-md text-lg text-mute">Cards you&apos;ve collected. Saved in this browser only.</p>
      <Binder />
    </Sheet>
  );
}
