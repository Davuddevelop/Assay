/**
 * A large, cinematic certification seal — the hero centerpiece. Struck-metal
 * hallmark rendered in SVG: concentric engraved rings, a radial tick bezel,
 * engraved legend around the rim, a metallic check at the core, plus a rotating
 * specular sweep and outer bloom. This is the "beautiful lit object in a dark
 * field" the reference sites lead with — but it *is* our brand and it reads as
 * security/certification, not decoration.
 */
export function HallmarkMedallion({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative aspect-square w-full">
        {/* outer bloom */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--color-iris) 55%, transparent), transparent 60%)",
          }}
        />
        <svg viewBox="0 0 400 400" className="relative h-full w-full" role="img" aria-label="Assay certified hallmark">
          <defs>
            <radialGradient id="med-face" cx="50%" cy="38%" r="70%">
              <stop offset="0%" stopColor="#20213a" />
              <stop offset="55%" stopColor="#141527" />
              <stop offset="100%" stopColor="#0b0b16" />
            </radialGradient>
            <linearGradient id="med-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="45%" stopColor="#8b8bf0" />
              <stop offset="100%" stopColor="#5b7cf0" />
            </linearGradient>
            <linearGradient id="med-ring" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6f6fd8" />
              <stop offset="50%" stopColor="#3b3b63" />
              <stop offset="100%" stopColor="#6f6fd8" />
            </linearGradient>
            <radialGradient id="med-sheen" cx="50%" cy="30%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <path id="med-rim" d="M200,84 a116,116 0 1,1 -0.1,0" fill="none" />
          </defs>

          {/* disc */}
          <circle cx="200" cy="200" r="164" fill="url(#med-face)" stroke="url(#med-ring)" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="url(#med-metal)" strokeWidth="2.5" opacity="0.85" />

          {/* radial tick bezel */}
          {Array.from({ length: 72 }).map((_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const major = i % 6 === 0;
            const r1 = 150;
            const r2 = major ? 138 : 144;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * r1}
                y1={200 + Math.sin(a) * r1}
                x2={200 + Math.cos(a) * r2}
                y2={200 + Math.sin(a) * r2}
                stroke="url(#med-metal)"
                strokeWidth={major ? 1.8 : 0.8}
                opacity={major ? 0.9 : 0.45}
              />
            );
          })}

          {/* engraved legend around the rim */}
          <text fill="#a5a5c8" fontFamily="var(--font-mono), monospace" fontSize="12.5">
            <textPath href="#med-rim" startOffset="0" textLength="724" lengthAdjust="spacing">
              ASSAY · CERTIFIED · SAFE TO PUBLISH ·
            </textPath>
          </text>

          {/* core */}
          <circle cx="200" cy="200" r="96" fill="url(#med-face)" stroke="url(#med-ring)" strokeWidth="1" />
          {/* the struck "A" monogram + check */}
          <path d="M162,246 200,150 238,246" fill="none" stroke="url(#med-metal)" strokeWidth="7" strokeLinejoin="miter" strokeLinecap="square" />
          <path d="M178,214 H222" stroke="url(#med-metal)" strokeWidth="7" strokeLinecap="square" />
          <path d="M170,196 187,213 214,178" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

          {/* specular sweep — slow rotation */}
          <g style={{ transformOrigin: "200px 200px" }}>
            <circle cx="200" cy="200" r="164" fill="url(#med-sheen)">
              <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="14s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      </div>
    </div>
  );
}
