import type { Metadata } from "next";
import { Binder } from "@/components/Binder";
import { Headline, Label } from "@/components/bp";

export const metadata: Metadata = { title: "Binder" };

export default function BinderPage() {
  return (
    <section className="px-4 pt-6 sm:px-6">
      <Label className="text-blue/60">Collection · this browser only</Label>
      <Headline className="mt-2 text-[clamp(44px,6.4vw,92px)]">Binder.</Headline>
      <Binder />
    </section>
  );
}
