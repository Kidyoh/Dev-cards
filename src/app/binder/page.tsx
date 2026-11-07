import type { Metadata } from "next";
import { Binder } from "@/components/Binder";

export const metadata: Metadata = { title: "My binder" };

export default function BinderPage() {
  return (
    <>
      <h1>My binder</h1>
      <p className="muted">Cards you&apos;ve collected. Your binder is saved in this browser only.</p>
      <Binder />
    </>
  );
}
