"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

/**
 * GradualBlur — a stack of masked backdrop-blur layers that fade progressively
 * toward one edge (React Bits, ported dependency-free and typed). Used as a
 * page-top frost so content dissolves as it scrolls under the floating nav.
 */
type Position = "top" | "bottom" | "left" | "right";
type Curve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";

export interface GradualBlurProps {
  position?: Position;
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  curve?: Curve;
  opacity?: number;
  animated?: boolean | "scroll";
  duration?: string;
  easing?: string;
  hoverIntensity?: number;
  target?: "parent" | "page";
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
}

const CURVE: Record<Curve, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const DIRECTION: Record<Position, string> = {
  top: "to top",
  bottom: "to bottom",
  left: "to left",
  right: "to right",
};

function GradualBlurBase(props: GradualBlurProps) {
  const {
    position = "bottom",
    strength = 2,
    height = "6rem",
    width,
    divCount = 5,
    exponential = false,
    curve = "linear",
    opacity = 1,
    animated = false,
    duration = "0.3s",
    easing = "ease-out",
    hoverIntensity,
    target = "parent",
    zIndex = 1000,
    className = "",
    style,
  } = props;

  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(animated !== "scroll");

  useEffect(() => {
    if (animated !== "scroll" || !ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [animated]);

  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = [];
    const increment = 100 / divCount;
    const s = hovered && hoverIntensity ? strength * hoverIntensity : strength;
    const curveFn = CURVE[curve] ?? CURVE.linear;
    const dir = DIRECTION[position];

    for (let i = 1; i <= divCount; i++) {
      const progress = curveFn(i / divCount);
      const blur = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * s
        : 0.0625 * (progress * divCount + 1) * s;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const divStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        maskImage: `linear-gradient(${dir}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${dir}, ${gradient})`,
        backdropFilter: `blur(${blur.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blur.toFixed(3)}rem)`,
        opacity,
        transition:
          animated && animated !== "scroll"
            ? `backdrop-filter ${duration} ${easing}`
            : undefined,
      };
      divs.push(<div key={i} style={divStyle} />);
    }
    return divs;
  }, [
    position,
    strength,
    divCount,
    exponential,
    curve,
    opacity,
    animated,
    duration,
    easing,
    hovered,
    hoverIntensity,
  ]);

  const containerStyle = useMemo<CSSProperties>(() => {
    const vertical = position === "top" || position === "bottom";
    const page = target === "page";
    const base: Record<string, string | number | undefined> = {
      position: page ? "fixed" : "absolute",
      pointerEvents: hoverIntensity ? "auto" : "none",
      opacity: visible ? 1 : 0,
      transition: animated ? `opacity ${duration} ${easing}` : undefined,
      zIndex: page ? zIndex + 100 : zIndex,
    };
    if (vertical) {
      base.height = height;
      base.width = width ?? "100%";
      base[position] = 0;
      base.left = 0;
      base.right = 0;
    } else {
      base.width = width ?? height;
      base.height = "100%";
      base[position] = 0;
      base.top = 0;
      base.bottom = 0;
    }
    return { ...base, ...style } as CSSProperties;
  }, [
    position,
    target,
    height,
    width,
    visible,
    animated,
    duration,
    easing,
    hoverIntensity,
    zIndex,
    style,
  ]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`gradual-blur ${target === "page" ? "gradual-blur-page" : "gradual-blur-parent"} ${className}`.trim()}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setHovered(false) : undefined}
    >
      <div
        className="gradual-blur-inner"
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {blurDivs}
      </div>
    </div>
  );
}

export const GradualBlur = memo(GradualBlurBase);
