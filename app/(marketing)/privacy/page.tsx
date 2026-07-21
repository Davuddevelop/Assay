import type { Metadata } from "next";

import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy — Assay",
  description: "What Assay collects, what it never stores, and who processes it.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="July 2026"
      intro="Assay is a security tool, so restraint with data is the whole point. This explains exactly what we collect, what we deliberately never store, and who helps us run the service."
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account.</strong> When you sign in with GitHub we receive your
            GitHub handle, email, avatar, and numeric id — nothing more (we never
            ask for repository access).
          </li>
          <li>
            <strong>Scans.</strong> The app URLs you submit, and the findings we
            produce (issue type, severity, plain-language explanation, and a{" "}
            <strong>redacted</strong> location such as a column name or file name).
          </li>
          <li>
            <strong>Usage &amp; billing.</strong> Scan counts for metering, your
            plan, and — if you subscribe — a Stripe customer id. Card details go
            straight to Stripe; we never see or store them.
          </li>
        </ul>
      </section>

      <section>
        <h2>What we never store</h2>
        <ul>
          <li>
            <strong>Secret values.</strong> If a scan finds a leaked key, we
            record <em>where</em> it leaked, never the key itself — it&rsquo;s
            redacted before anything is saved.
          </li>
          <li>
            <strong>Your users&rsquo; data.</strong> Our database checks confirm
            whether access is open or closed; they do not read, copy, or store the
            rows in your tables. Zero rows of user data are retained.
          </li>
          <li>
            <strong>Your source or page content.</strong> We analyze your app&rsquo;s
            code in memory during a scan and keep only the findings — not the code
            or the page bodies.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>
          To run scans, show you your reports, meter and bill your plan, send the
          alerts you asked for by watching an app, and keep the service secure.
          We don&rsquo;t sell your data or use it for advertising.
        </p>
      </section>

      <section>
        <h2>Who processes it (sub-processors)</h2>
        <ul>
          <li><strong>Supabase</strong> — database, authentication.</li>
          <li><strong>Vercel</strong> — hosting.</li>
          <li><strong>Anthropic</strong> — generating plain-language explanations from findings (no secret values are sent).</li>
          <li><strong>Stripe</strong> — payments (paid plans only).</li>
          <li><strong>Resend</strong> — sending alert emails (paid plans only).</li>
          <li><strong>Inngest</strong> — scheduling background re-checks.</li>
        </ul>
      </section>

      <section>
        <h2>Retention</h2>
        <p>
          We keep your scans and account data while your account is active. Delete
          your account and we remove your personal data, except where we must keep
          limited records (for example, billing history) to meet legal
          obligations.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can access, correct, export, or delete your data. Email{" "}
          <a href="mailto:hello@assay.dev">hello@assay.dev</a> and we&rsquo;ll
          help. Depending on where you live, you may have additional rights under
          laws such as the GDPR or CCPA.
        </p>
      </section>

      <section>
        <h2>Security &amp; cookies</h2>
        <p>
          Row-level security scopes every user to their own data; all privileged
          writes happen server-side. We use only the cookies needed to keep you
          signed in — no third-party advertising trackers.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Privacy questions go to{" "}
          <a href="mailto:hello@assay.dev">hello@assay.dev</a>. Assay is operated
          by <strong>[legal entity]</strong>.
        </p>
      </section>
    </LegalDoc>
  );
}
