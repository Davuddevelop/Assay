import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { Eyebrow } from "@/components/section-heading";
import { mockUser } from "@/lib/mock";

export const metadata: Metadata = {
  title: "Dashboard — Assay",
  description: "Your connected repositories and recent checks.",
};

export default function DashboardPage() {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div
        aria-hidden
        className="bg-grid absolute inset-x-0 top-0 -z-10 h-64 opacity-50"
      />
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
          {mockUser.name}&rsquo;s workspace
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
          Nothing assayed yet.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory-dim">
          Connect a repository and Assay will check the next change — your tests,
          a security scan, and your rules — then strike the hallmark.
        </p>
      </header>

      <section className="mt-14">
        <Eyebrow label="Repositories" />
        <div className="mt-6">
          <EmptyState
            title="Connect your first repo"
            body="Assay watches a repository and strikes a hallmark on every change. Connect one to begin."
            action={{ label: "Connect a repo", href: "/login" }}
          />
        </div>
      </section>

      <section className="mt-16">
        <Eyebrow label="Recent checks" />
        <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-ivory-dim">
            No checks yet. The first will appear here once a repository is
            connected and a change lands.
          </p>
        </div>
      </section>
    </div>
  );
}
