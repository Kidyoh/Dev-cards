"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";

/** A panel whose border and surface light up where the pointer is (spotlight card). */
export function Glow({
  as: Tag = "div",
  className = "",
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>) {
  return (
    <Tag
      className={`glow ${className}`}
      style={style}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--gx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--gy", `${e.clientY - r.top}px`);
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
