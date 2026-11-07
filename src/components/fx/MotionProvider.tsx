"use client";

import { MotionConfig } from "motion/react";

/** Honour the OS "reduce motion" setting everywhere: transform animations become instant. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
