import type { Metadata } from "next";
import { Suspense } from "react";
import { BoardView } from "@/components/BoardView";

export const metadata: Metadata = { title: "Board" };

export default function LeaderboardPage() {
  return (
    <Suspense>
      <BoardView />
    </Suspense>
  );
}
