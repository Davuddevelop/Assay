"use client";

import { useEffect } from "react";

/**
 * "Save as PDF" — opens the browser's print dialog for the report.
 *
 * The target user is a freelancer or small agency shipping client work
 * (CLAUDE.md §3), and what they actually do with a finished report is send it
 * to the client. That path didn't exist: there was no print stylesheet in the
 * repo at all, so printing produced the nav, the footer, the scroll-progress
 * bar and a "Copy fix" button on paper.
 *
 * `window.print()` rather than a server-side PDF renderer: it is one line, it
 * uses the machine's own "Save as PDF", and it costs no dependency and no
 * render budget. If people actually send these, a real renderer can come
 * later — for now this tests whether anyone wants the thing at all.
 */
export function PrintButton() {
  // Each finding's manual steps live in a collapsed <details>. A closed one
  // cannot be opened from CSS, so on paper those steps would simply be absent
  // — content the screen version has and the printed copy doesn't. Listening
  // for `beforeprint` rather than only handling our own button means Cmd-P is
  // covered too. Anything the user had already expanded stays expanded
  // afterwards; only the ones we opened get closed again.
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];

    const expand = () => {
      opened = [...document.querySelectorAll("details")].filter((d) => !d.open);
      opened.forEach((d) => {
        d.open = true;
      });
    };
    const restore = () => {
      opened.forEach((d) => {
        d.open = false;
      });
      opened = [];
    };

    window.addEventListener("beforeprint", expand);
    window.addEventListener("afterprint", restore);
    return () => {
      window.removeEventListener("beforeprint", expand);
      window.removeEventListener("afterprint", restore);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:border-border-strong hover:text-ivory"
    >
      Save as PDF
    </button>
  );
}
