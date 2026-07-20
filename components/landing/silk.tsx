"use client";

import { useEffect, useRef } from "react";

/**
 * Silk — an ambient flowing-fabric background (ported from the React Bits Silk
 * shader to raw WebGL so it carries no runtime dependency). Renders on a canvas
 * behind the hero; freezes to a single still frame under reduced-motion and
 * falls back to CSS (the caller's gradient) when WebGL is unavailable.
 *
 * Tuned to Assay's iris/silk palette so it reads as a quiet, premium texture
 * rather than a loud effect.
 */
export function Silk({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return; // leave the caller's CSS fallback visible

    const vert = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;
    const frag = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3  uColor;
      uniform float uSpeed;
      uniform float uScale;
      uniform float uNoise;
      uniform vec2  uRes;
      const float e = 2.71828182845904523536;
      float noise(vec2 p) { float G = e; vec2 r = (G * sin(G * p)); return fract(r.x * r.y * (1.0 + p.x)); }
      vec2 rot(vec2 uv, float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c) * uv; }
      void main() {
        float aspect = uRes.x / uRes.y;
        vec2 uv = vUv; uv.x *= aspect;
        float rnd = noise(gl_FragCoord.xy);
        uv = rot(uv * uScale, 0.0);
        vec2 tex = uv * uScale;
        float t = uSpeed * uTime;
        tex.y += 0.03 * sin(8.0 * tex.x - t);
        float pattern = 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y +
          cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * t) +
          sin(20.0 * (tex.x + tex.y - 0.1 * t)));
        vec3 col = uColor * pattern - (rnd / 15.0) * uNoise;
        gl_FragColor = vec4(col, 1.0);
      }`;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uTime = U("uTime");
    const uRes = U("uRes");
    gl.uniform3f(U("uColor"), 0.482, 0.455, 0.506); // muted silk mauve (#7B7481)
    gl.uniform1f(U("uSpeed"), 4.4);
    gl.uniform1f(U("uScale"), 1.0);
    gl.uniform1f(U("uNoise"), 1.4);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    };
    window.addEventListener("resize", resize);
    resize();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const frame = (now: number) => {
      t += ((now - last) / 1000) * 0.16;
      last = now;
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    if (reduce) {
      gl.uniform1f(uTime, 2.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
