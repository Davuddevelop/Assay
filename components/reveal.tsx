"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  /** Stagger the fade-up; milliseconds of delay. */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * A quiet fade-up as the element scrolls into view, once. Honors
 * prefers-reduced-motion via CSS (the .reveal rule resolves to no motion).
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      data-shown={shown}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}
