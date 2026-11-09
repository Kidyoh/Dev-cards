import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";

export const metadata: Metadata = { title: "Versus" };

export default function ComparePage() {
  return (
    <Suspense>
      <CompareView />
    </Suspense>
  );
}
