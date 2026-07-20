"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Blur Text — the React Bits type animation, ported to a dependency-free React
 * component. Splits its rendered text into words that blur + rise into focus,
 * one after another. Inline elements (like the italic accent word) are kept
 * whole. Reveals on load when `immediate`, otherwise as it scrolls into view.
 * Reduced-motion users get the text instantly (handled in CSS).
 */
export function BlurText({
  as,
  className,
  children,
  stagger = 70,
  startDelay = 0,
  immediate = false,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  stagger?: number;
  startDelay?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "span") as ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Split text nodes into per-word spans; keep inline elements whole.
    const units: HTMLElement[] = [];
    const frag = document.createDocumentFragment();
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        (node.textContent ?? "").split(/(\s+)/).forEach((part) => {
          if (part === "") return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const s = document.createElement("span");
          s.className = "bw-word";
          s.textContent = part;
          frag.appendChild(s);
          units.push(s);
        });
      } else if (node.nodeName === "BR") {
        frag.appendChild(node.cloneNode());
      } else if (node instanceof HTMLElement) {
        node.classList.add("bw-word");
        frag.appendChild(node);
        units.push(node);
      }
    });
    el.textContent = "";
    el.appendChild(frag);

    const reveal = () =>
      units.forEach((u, i) =>
        window.setTimeout(() => u.classList.add("in"), startDelay + i * stagger),
      );

    if (immediate) {
      reveal();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          reveal();
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stagger, startDelay, immediate]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
