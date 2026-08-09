import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms of Service — Assay",
  description: "The terms that govern your use of Assay.",
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated="August 2026"
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
        <p>
          Three other documents form part of this agreement and are worth
          reading: our <Link href="/license">License Terms</Link> (who owns a
          report, and the rules for displaying the hallmark), our{" "}
          <Link href="/acceptable-use">Acceptable Use Policy</Link>, and our{" "}
          <Link href="/dmca">Copyright &amp; DMCA Policy</Link>. What we do with
          your data is set out separately in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>2. Your account</h2>
        <p>
          You sign in with a code we email you, or with GitHub. There is no
          password. You&rsquo;re responsible for activity under your account,
          and for keeping access to the email address it uses &mdash; anyone
          who can read that inbox can sign in as you.
        </p>
        <p>
          <strong>You must be at least 16 years old to use Assay.</strong> If
          you are under 18, you may only use it with the involvement of a parent
          or guardian, who accepts these terms with you and is responsible for
          any paid plan. We don&rsquo;t knowingly collect data from anyone under
          16 &mdash; tell us at{" "}
          <a href="mailto:hello@assaysecurity.com">hello@assaysecurity.com</a>{" "}
          if that has happened and we&rsquo;ll delete it.
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
          &ldquo;as is,&rdquo; without warranties of any kind. Reports and badges
          are provided for your own informational use; Assay disclaims any duty
          of care to, and any liability toward, anyone other than the account
          holder who requested the scan &mdash; including third parties who view
          a shared report or badge link.
        </p>
      </section>

      <section>
        <h2>5. Plans and billing</h2>
        <p>
          <strong>
            Paid plans are not currently available to buy &mdash; every account
            is on the free tier, and nothing on this site can charge you today.
          </strong>{" "}
          The rest of this section, and the refund policy below, describe how
          billing works when it opens. Say so plainly rather than leave a
          section that reads as though a purchase is possible.
        </p>
        <p>
          Assay has a free tier and paid plans. Paid plans are billed monthly in
          advance and renew until you cancel. Payments are processed by{" "}
          <strong>Lemon Squeezy</strong>, which is the merchant and seller of
          record for every paid plan: your purchase contract for the
          transaction is with Lemon Squeezy, they issue your invoice, and they
          collect any VAT or sales tax due in your country. Lemon
          Squeezy&rsquo;s own terms apply to the payment alongside these terms.
          You can cancel any time from your billing page;
          access continues until the end of the paid period, and you are not
          charged again. We may change prices with notice, and any change applies
          only to future billing periods &mdash; never to one you have paid for.
        </p>
      </section>

      {/* Linked directly from the footer — a refund policy nobody can find is
          not a refund policy, and reviewers look for one. */}
      <section id="refunds" className="scroll-mt-24">
        <h2>6. Refunds</h2>
        <p>
          <strong>
            If Assay isn&rsquo;t what you expected, email{" "}
            <a href="mailto:hello@assaysecurity.com">hello@assaysecurity.com</a>{" "}
            within 14 days of a charge and we will refund it in full.
          </strong>{" "}
          No conditions and no explanation required. This applies to your first
          payment and to any renewal.
        </p>
        <p>
          Refunds are issued by Lemon Squeezy, the seller of record, back to
          the original payment method &mdash; typically within 5&ndash;10
          business days depending on your bank. You may also request a refund
          directly from Lemon Squeezy using the receipt they emailed you.
        </p>
        <p>
          Beyond that window, a subscription can be cancelled at any time to stop
          future charges, and we&rsquo;ll still consider a refund if something
          went wrong on our side &mdash; a failed scan you were billed for, a
          duplicate charge, or a renewal you had already cancelled. Nothing here
          limits any refund right you have under the consumer law of your own
          country. The full policy, in plain language, is at{" "}
          <Link href="/refunds">assaysecurity.com/refunds</Link>.
        </p>
      </section>

      <section>
        <h2>7. Acceptable use &amp; limits</h2>
        <p>
          Don&rsquo;t abuse the service: no scanning of apps you don&rsquo;t own,
          no attempts to overload or circumvent rate limits, no use of Assay to
          attack or exploit any system. We rate-limit and meter scans, and we may
          suspend accounts that break these rules.
        </p>
      </section>

      <section>
        <h2>8. Indemnification</h2>
        <p>
          You agree to indemnify and hold Assay and its operators harmless from
          any claim, loss, or expense (including reasonable legal fees) arising
          from: your breach of these terms; your scanning of an app you
          don&rsquo;t own or aren&rsquo;t authorized to test; or a third
          party&rsquo;s reliance on a report or badge you shared, generated, or
          embedded.
        </p>
      </section>

      <section>
        <h2>9. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Assay and its operators
          aren&rsquo;t liable for indirect, incidental, or consequential damages,
          or for any loss arising from a security issue Assay did not detect. Our
          total liability for any claim is limited to the greater of (a) the
          amount you paid us in the three months before the claim, or (b) US$100.
        </p>
        <p>
          Some countries don&rsquo;t allow the exclusion of certain warranties or
          liabilities. Where that&rsquo;s the case, the limits above apply only
          as far as that law permits, and nothing here removes a right you
          can&rsquo;t contract out of &mdash; including liability for fraud,
          death, or personal injury caused by negligence.
        </p>
      </section>

      <section>
        <h2>10. Termination</h2>
        <p>
          You can stop using Assay and delete your account at any time. We may
          suspend or terminate access for breach of these terms. Sections that by
          their nature should survive termination (disclaimers, liability limits)
          will survive.
        </p>
      </section>

      <section>
        <h2>11. Changes</h2>
        <p>
          We may update these terms; we&rsquo;ll change the date above and, for
          material changes, give reasonable notice. Continued use after a change
          means you accept the updated terms.
        </p>
      </section>

      <section>
        <h2>12. Contact &amp; governing law</h2>
        <p>
          Assay is operated by <strong>Aynur Əliyeva</strong>, based in Baku,
          Azerbaijan Republic. These terms are governed by the laws of the{" "}
          <strong>Azerbaijan Republic</strong>, and the courts of Baku have
          jurisdiction over any dispute &mdash; except where the consumer law of
          your own country gives you the right to bring a claim locally, which
          nothing here takes away. Questions go to{" "}
          <a href="mailto:hello@assaysecurity.com">hello@assaysecurity.com</a>.
        </p>
      </section>
    </LegalDoc>
  );
}
