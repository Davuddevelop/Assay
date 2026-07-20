"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * LogoLoop — the React Bits infinite logo marquee, ported to a dependency-free
 * component: velocity-smoothed continuous scroll, decelerate-on-hover, edge
 * fade, scale-on-hover, and reduced-motion safety (freezes). Measures one
 * sequence and duplicates enough copies to fill the width seamlessly.
 */
const SMOOTH_TAU = 0.25;
const MIN_COPIES = 2;

function VercelMark() {
  return (
    <span className="ll-ico" title="Vercel">
      <svg viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M12 2 23 21 1 21Z" />
      </svg>
    </span>
  );
}

function ReactMark() {
  return (
    <span className="ll-ico" title="React">
      <svg viewBox="-12 -12 24 24" aria-hidden>
        <circle r="2.05" fill="currentColor" />
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    </span>
  );
}

const wm = (name: string) => <span className="ll-wm">{name}</span>;

// Assay's world: the AI builders it checks + the infra they ship onto. Two
// marks reproduced accurately; the rest as clean monochrome wordmarks. Swap in
// each brand's official SVG from its press kit for production.
const DEFAULT_LOGOS: ReactNode[] = [
  wm("Lovable"),
  wm("Bolt"),
  wm("Replit"),
  wm("v0"),
  wm("Supabase"),
  <VercelMark key="vercel" />,
  wm("Next.js"),
  <ReactMark key="react" />,
  wm("Firebase"),
  wm("Stripe"),
];

export function LogoLoop({
  logos = DEFAULT_LOGOS,
  speed = 42,
  hoverSpeed = 12,
  gap = 60,
  logoHeight = 26,
}: {
  logos?: ReactNode[];
  speed?: number;
  hoverSpeed?: number;
  gap?: number;
  logoHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(MIN_COPIES);
  const [hovered, setHovered] = useState(false);

  const measure = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const w = seqRef.current?.getBoundingClientRect().width ?? 0;
    if (w > 0) {
      setSeqWidth(Math.ceil(w));
      setCopyCount(Math.max(MIN_COPIES, Math.ceil(containerWidth / w) + 2));
    }
  }, []);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (seqRef.current) ro.observe(seqRef.current);
    return () => ro.disconnect();
  }, [measure, logos, gap, logoHeight]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last: number | null = null;
    let offset = 0;
    let vel = 0;
    const target = () => (hovered ? hoverSpeed : speed);

    const tick = (now: number) => {
      if (last === null) last = now;
      const dt = Math.max(0, now - last) / 1000;
      last = now;
      vel += (target() - vel) * (1 - Math.exp(-dt / SMOOTH_TAU));
      if (seqWidth > 0) {
        offset = ((offset + vel * dt) % seqWidth) + (offset < 0 ? seqWidth : 0);
        offset %= seqWidth;
        track.style.transform = `translate3d(${-offset}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seqWidth, hovered, speed, hoverSpeed]);

  const lists = Array.from({ length: copyCount }, (_, copy) => (
    <ul
      key={copy}
      className="logoloop__list"
      role="list"
      aria-hidden={copy > 0}
      ref={copy === 0 ? seqRef : undefined}
    >
      {logos.map((node, i) => (
        <li key={i} className="logoloop__item" role="listitem">
          {node}
        </li>
      ))}
    </ul>
  ));

  return (
    <div
      ref={containerRef}
      className="logoloop"
      role="region"
      aria-label="Compatible builders and platforms"
      style={
        {
          "--ll-h": `${logoHeight}px`,
          "--ll-gap": `${gap}px`,
        } as React.CSSProperties
      }
    >
      <div
        ref={trackRef}
        className="logoloop__track"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {lists}
      </div>
    </div>
  );
}
