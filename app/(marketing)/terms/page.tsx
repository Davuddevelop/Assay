import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service — Assay",
  description: "The terms that govern your use of Assay.",
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated="July 2026"
      intro="These terms govern your use of Assay, a security checkpoint for apps built with AI. By creating an account or running a scan, you agree to them."
    >
      <section>
        <h2>1. The service</h2>
        <p>
          Assay fetches a web app you point us at, inspects what it already
          serves to browsers (its pages, its JavaScript bundles, its response
          headers) and runs bounded, read-only checks for common security
          problems — exposed keys, an open database, missing protections. It then
          explains what it found in plain language and, where it can, gives you
          the exact change to make. Assay is a{" "}
          <strong>best-effort detection tool</strong>, not a guarantee.
        </p>
      </section>

      <section>
        <h2>2. Your account</h2>
        <p>
          You sign in with GitHub. You&rsquo;re responsible for activity under
          your account and for keeping your login secure. You must be old enough
          to form a binding contract in your jurisdiction.
        </p>
      </section>

      <section>
        <h2>3. Scan only what you own</h2>
        <p>
          You may submit a URL for scanning <strong>only</strong> if you own the
          app or are explicitly authorized to test it. Scanning apps you
          don&rsquo;t control may be illegal and is a breach of these terms. Our{" "}
          <Link href="/acceptable-use">Acceptable Use Policy</Link> is part of
          this agreement; read it.
        </p>
      </section>

      <section>
        <h2>4. No security guarantee</h2>
        <p>
          A passing result (&ldquo;Certified&rdquo; or the hallmark) means Assay
          did not find the specific issues it checks for at the time of the scan.
          It is <strong>not</strong> a warranty that your app is secure, and it
          is not a substitute for a professional security audit. Apps change;
          verification ages. New issues can appear that Assay does not check for.
          You remain responsible for your app&rsquo;s security. Assay is provided
          &ldquo;as is,&rdquo; without warranties of any kind.
        </p>
      </section>

      <section>
        <h2>5. Plans and billing</h2>
        <p>
          Assay has a free tier and paid plans. Paid plans are billed monthly in
          advance through Stripe and renew until you cancel. You can cancel any
          time from your billing page; access continues until the end of the paid
          period. Fees are non-refundable except where required by law. We may
          change prices with notice for future billing periods.
        </p>
      </section>

      <section>
        <h2>6. Acceptable use &amp; limits</h2>
        <p>
          Don&rsquo;t abuse the service: no scanning of apps you don&rsquo;t own,
          no attempts to overload or circumvent rate limits, no use of Assay to
          attack or exploit any system. We rate-limit and meter scans, and we may
          suspend accounts that break these rules.
        </p>
      </section>

      <section>
        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Assay and its operators
          aren&rsquo;t liable for indirect, incidental, or consequential damages,
          or for any loss arising from a security issue Assay did not detect. Our
          total liability for any claim is limited to the amount you paid us in
          the three months before the claim.
        </p>
      </section>

      <section>
        <h2>8. Termination</h2>
        <p>
          You can stop using Assay and delete your account at any time. We may
          suspend or terminate access for breach of these terms. Sections that by
          their nature should survive termination (disclaimers, liability limits)
          will survive.
        </p>
      </section>

      <section>
        <h2>9. Changes</h2>
        <p>
          We may update these terms; we&rsquo;ll change the date above and, for
          material changes, give reasonable notice. Continued use after a change
          means you accept the updated terms.
        </p>
      </section>

      <section>
        <h2>10. Contact &amp; governing law</h2>
        <p>
          Assay is operated by <strong>[legal entity]</strong> and these terms
          are governed by the laws of <strong>[jurisdiction]</strong>. Questions
          go to{" "}
          <a href="mailto:hello@assay.dev">hello@assay.dev</a>.
        </p>
      </section>
    </LegalDoc>
  );
}
