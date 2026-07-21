import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Assay",
  description:
    "Scan only apps you own. How Assay scans, what's prohibited, and how to report a vulnerability.",
};

export default function AcceptableUsePage() {
  return (
    <LegalDoc
      title="Acceptable Use Policy"
      updated="July 2026"
      intro="Assay probes live web apps. That power is only acceptable when it's pointed at your own app. This policy is part of our Terms — breaking it can get your account suspended."
    >
      <section>
        <h2>Scan only apps you own</h2>
        <p>
          <strong>You may submit an app for scanning only if you own it</strong>{" "}
          or have explicit, documented authorization from the owner to test it.
          Scanning someone else&rsquo;s app without permission can violate computer
          misuse laws (like the US CFAA and equivalents worldwide) — even a
          read-only scan. Don&rsquo;t do it.
        </p>
      </section>

      <section>
        <h2>How Assay scans — detection only</h2>
        <p>Assay is deliberately restrained. It:</p>
        <ul>
          <li>fetches only what your app already serves to any browser;</li>
          <li>makes read-only, bounded requests — no exploitation, no writes, no attempts to extract your users&rsquo; data;</li>
          <li>redacts secret values and never stores a row of user data;</li>
          <li>blocks internal, private, and cloud-metadata addresses (SSRF protection) and re-checks every redirect;</li>
          <li>rate-limits and meters scans to prevent abuse.</li>
        </ul>
        <p>
          See the <Link href="/privacy">Privacy Policy</Link> for what we keep.
        </p>
      </section>

      <section>
        <h2>What&rsquo;s prohibited</h2>
        <ul>
          <li>Scanning apps you don&rsquo;t own or aren&rsquo;t authorized to test.</li>
          <li>Using Assay to attack, exploit, overload, or gain unauthorized access to any system.</li>
          <li>Circumventing rate limits, quotas, or ownership expectations, or scripting the service for bulk/abusive use.</li>
          <li>Using results to harm a third party, or reselling scans of others&rsquo; apps.</li>
          <li>Interfering with Assay&rsquo;s own security or infrastructure.</li>
        </ul>
      </section>

      <section>
        <h2>Reporting a vulnerability in Assay</h2>
        <p>
          Found a security issue in Assay itself? Tell us first at{" "}
          <a href="mailto:security@assay.dev">security@assay.dev</a>, with enough
          detail to reproduce it. We welcome good-faith research and won&rsquo;t
          pursue legal action against researchers who:
        </p>
        <ul>
          <li>test only against their own Assay account and data;</li>
          <li>avoid privacy violations, data destruction, and service disruption;</li>
          <li>give us reasonable time to fix the issue before disclosing it publicly.</li>
        </ul>
        <p>
          Please don&rsquo;t access other users&rsquo; data or run automated
          scanners against our infrastructure as part of your testing.
        </p>
      </section>

      <section>
        <h2>Enforcement</h2>
        <p>
          We may rate-limit, suspend, or terminate accounts that break this
          policy, and report unlawful activity to the appropriate authorities.
        </p>
      </section>
    </LegalDoc>
  );
}
