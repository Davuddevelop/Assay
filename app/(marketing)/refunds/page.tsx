import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Refund Policy — Assay",
  description:
    "Full refund within 14 days of any charge, no conditions. How to request one and how long it takes.",
};

/**
 * The refund policy on its own page.
 *
 * It is also section 6 of the Terms, which is where it binds — but a policy
 * that can only be found by opening a contract and reading to the sixth
 * heading is not findable, and payment providers ask for it as a distinct URL
 * during verification. This page is the plain-language version; the Terms
 * remain the agreement.
 */
export default function RefundsPage() {
  return (
    <LegalDoc
      title="Refund Policy"
      updated="July 2026"
      intro="If Assay isn't what you expected, we refund you. No conditions, no forms, and no explanation required."
    >
      <section>
        <h2>The short version</h2>
        <p>
          <strong>
            Email{" "}
            <a href="mailto:hello@assaysecurity.com">hello@assaysecurity.com</a>{" "}
            within 14 days of a charge and we will refund it in full.
          </strong>{" "}
          That applies to your first payment and to any renewal. You don&rsquo;t
          need to explain why.
        </p>
      </section>

      <section>
        <h2>How to request one</h2>
        <p>
          Email us from the address on your account, or reply to the receipt
          Paddle sent you. Either works. You can also request a refund directly
          from Paddle using that receipt &mdash; Paddle is the seller of record
          for every paid plan, so they issue the money back.
        </p>
      </section>

      <section>
        <h2>How long it takes</h2>
        <p>
          We approve refund requests within one business day. Paddle returns the
          money to the original payment method, which typically takes a further
          5&ndash;10 business days depending on your bank. Any VAT or sales tax
          collected is refunded with it.
        </p>
      </section>

      <section>
        <h2>Cancelling instead</h2>
        <p>
          You can cancel a subscription at any time from your billing page. That
          stops all future charges immediately, and your paid features continue
          until the end of the period you already paid for. Cancelling is not the
          same as a refund &mdash; if you want the last charge back, email us.
        </p>
      </section>

      <section>
        <h2>After 14 days</h2>
        <p>
          Cancel any time to stop future charges. We&rsquo;ll still refund you
          beyond the window if something went wrong on our side &mdash; a
          duplicate charge, a renewal you had already cancelled, or a period
          where the service didn&rsquo;t work. Ask us.
        </p>
      </section>

      <section>
        <h2>Your legal rights</h2>
        <p>
          Nothing here reduces any refund or cancellation right you have under
          the consumer law of your own country. Where that law gives you more
          than this policy does, it wins. This policy forms part of our{" "}
          <Link href="/terms">Terms of Service</Link>, where it appears as
          section 6.
        </p>
      </section>
    </LegalDoc>
  );
}
