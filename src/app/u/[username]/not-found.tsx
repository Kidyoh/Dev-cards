import { Eyebrow, Sheet } from "@/components/hud";
import { ScanForm } from "@/components/ScanForm";

export default function NotFound() {
  return (
    <Sheet tone="dark">
      <Eyebrow className="text-white">Error 404 · Subject not found</Eyebrow>
      <h1 className="mt-5 text-[clamp(44px,7vw,96px)] font-bold leading-[0.9]">
        No such <span className="text-orange">developer.</span>
      </h1>
      <p className="mt-6 max-w-md text-white/60">That GitHub user doesn&apos;t exist. Try another one.</p>
      <ScanForm className="mt-8" />
    </Sheet>
  );
}
