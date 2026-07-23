import { ImageResponse } from "next/og";

// Default OG image for marketing pages that don't override it. Colors match
// the current app/globals.css @theme tokens: onyx (#111113, page ground),
// ivory (#edeef0, primary text), and the iris accent gradient (#c4b5fd →
// #8b8bf0 → #5b7cf0) used for the hallmark stamp.
//
// Default (Node) runtime, not edge — this image has no dynamic/request data,
// so it can be statically generated once at build time instead of rendered
// per-request.

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111113",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          {/* Hallmark mark: a rotated square (diamond seal) with a struck
              triangle cut out, matching components/wordmark.tsx. */}
          <svg width="96" height="96" viewBox="0 0 24 24">
            <defs>
              <mask id="cut">
                <rect
                  x="5"
                  y="5"
                  width="14"
                  height="14"
                  rx="4"
                  transform="rotate(45 12 12)"
                  fill="white"
                />
                <path d="M12 7.3 16 14.7 8 14.7Z" fill="black" />
              </mask>
              <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" />
                <stop offset="50%" stopColor="#8b8bf0" />
                <stop offset="100%" stopColor="#5b7cf0" />
              </linearGradient>
            </defs>
            <rect
              x="5"
              y="5"
              width="14"
              height="14"
              rx="4"
              transform="rotate(45 12 12)"
              fill="url(#gold)"
              mask="url(#cut)"
            />
          </svg>
          <span
            style={{
              fontSize: 108,
              fontWeight: 600,
              color: "#edeef0",
              letterSpacing: "-0.02em",
            }}
          >
            Assay
          </span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 36,
            color: "#b9b6f7",
          }}
        >
          The independent check for AI-built apps.
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
