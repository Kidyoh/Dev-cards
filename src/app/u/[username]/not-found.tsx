import { Headline, Label, Win } from "@/components/bp";
import { ScanInput } from "@/components/ScanInput";

export default function NotFound() {
  return (
    <section className="mx-4 mt-10 max-w-xl sm:mx-6">
      <Label>Error 404</Label>
      <Headline className="mt-2 text-[clamp(44px,6vw,84px)]">Subject<br />not found.</Headline>
      <Win title="Instruction" className="mt-8">
        <p className="mb-2 font-mono text-[10.5px] uppercase text-blue">That GitHub user doesn&apos;t exist. Try another.</p>
        <ScanInput />
      </Win>
    </section>
  );
}
