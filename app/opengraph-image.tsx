import { ImageResponse } from "next/og";

import { MARK_PATH, MARK_VIEWBOX } from "@/lib/brand";

// Default OG image for marketing pages that don't override it. Colors match
// the current app/globals.css @theme tokens: onyx (#111113, page ground) and
// ivory (#edeef0, primary text). The mark is monochrome ivory (#f4f1ea), as
// supplied.
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
          {/* Same geometry as the nav mark — imported, not copied, because the
              two used to hold separate copies of the paths and drifted apart. */}
          <svg width="96" height="96" viewBox={MARK_VIEWBOX}>
            <path fill="#f4f1ea" fillRule="evenodd" d={MARK_PATH} />
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
        {/* Keep this in step with the h1 in components/landing/hero-v2.tsx.
            The two are separate strings by necessity — this renders through
            Satori and can't import a React component — so they drift silently
            unless changed together. */}
        <div
          style={{
            marginTop: 28,
            fontSize: 36,
            color: "#b9b6f7",
          }}
        >
          The tool that built your app can&rsquo;t be the one that clears it.
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
