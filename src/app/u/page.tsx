import type { Metadata } from "next";
import { CardView } from "@/components/CardView";

export const metadata: Metadata = { title: "Card" };

/** Static shell for /u/<username>; the card loads in the browser from the API. */
export default function CardPage() {
  return <CardView />;
}
