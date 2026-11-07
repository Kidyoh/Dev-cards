"use client";

import { useEffect, useRef } from "react";

/** Site-wide backdrop: drifting aurora blobs plus a dot grid lit up by a spotlight under the pointer. */
export function Background() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let x = window.innerWidth / 2, y = 200;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--sx", `${x}px`);
          el.style.setProperty("--sy", `${y}px`);
          raf = 0;
        });
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={ref} className="bg-fx" aria-hidden>
      <div className="bg-aurora a1" />
      <div className="bg-aurora a2" />
      <div className="bg-aurora a3" />
      <div className="bg-grid" />
      <div className="bg-grid lit" />
      <div className="bg-noise" />
    </div>
  );
}
