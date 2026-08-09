import type { Metadata } from "next";

import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
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
            plan, and — if you subscribe — a Lemon Squeezy customer id. Lemon
            Squeezy is the seller of record for paid plans: your card details,
            billing address, and any tax identifiers go to Lemon Squeezy, and
            we never see or store them.
          </li>
          <li>
            <strong>Anonymous scan statistics.</strong> When a scan runs without
            an account, we keep the <em>shape</em> of the result and nothing else:
            which builder made the app, the verdict, the score, and how many
            issues of each severity. No URL, no IP address, no account — nothing
            that could identify you or your app. It tells us how often AI-built
            apps ship with an open database, and lets us publish that.
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
        <h2>How we use it, and why we&rsquo;re allowed to</h2>
        <p>
          We don&rsquo;t sell your data or use it for advertising. Under the GDPR
          every use needs a legal basis; here is ours, purpose by purpose.
        </p>
        <ul>
          <li>
            <strong>Running scans, storing your reports, keeping you signed in,
            and sending the alerts you asked for</strong> &mdash; performance of
            our contract with you. This is the service you signed up for.
          </li>
          <li>
            <strong>Metering and billing your plan</strong> &mdash; performance
            of the contract, and our legal obligation to keep tax records.
          </li>
          <li>
            <strong>Rate limiting, abuse prevention, and keeping the service
            secure</strong> &mdash; our legitimate interest in not having the
            service abused, which we consider not to override your rights since
            it uses the minimum data needed and protects every user.
          </li>
          <li>
            <strong>Anonymous scan statistics and page analytics</strong> &mdash;
            legitimate interest in understanding how the product is used. Neither
            identifies you.
          </li>
        </ul>
      </section>

      <section>
        <h2>Where your data goes</h2>
        <p>
          Assay is operated from Azerbaijan, and the providers listed above run
          mainly in the United States and the European Union. If you are in the
          EEA or the UK, that means your data leaves your region.
        </p>
        <p>
          Each of those providers publishes a data processing agreement
          incorporating the European Commission&rsquo;s Standard Contractual
          Clauses, and those clauses are the safeguard these transfers rely on.
          We use them under those terms and don&rsquo;t transfer your data
          anywhere else.
        </p>
      </section>

      <section>
        <h2>Who processes it (sub-processors)</h2>
        <ul>
          <li><strong>Supabase</strong> — database, authentication.</li>
          <li><strong>Vercel</strong> — hosting.</li>
          <li><strong>Anthropic</strong> — generating plain-language explanations from findings (no secret values are sent).</li>
          <li><strong>Lemon Squeezy</strong> — payments and tax, as seller of record (paid plans only).</li>
          <li><strong>Resend</strong> — sending alert emails (paid plans only).</li>
          <li><strong>Inngest</strong> — scheduling background re-checks.</li>
          <li>
            <strong>Vercel Analytics</strong> — page views and performance. It
            sets no cookies and collects no personal data, which is why this site
            has no cookie banner.
          </li>
        </ul>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <ul>
          <li>
            <strong>Account, scans, findings, and your conversations with the
            agent</strong> &mdash; while your account is open. Delete your
            account and these are deleted with it, within 30 days.
          </li>
          <li>
            <strong>A record of alert emails sent</strong> &mdash; 12 months, so
            we don&rsquo;t send you the same alert twice.
          </li>
          <li>
            <strong>Rate-limiting counters</strong> &mdash; hours to days. They
            expire on their own.
          </li>
          <li>
            <strong>Billing records</strong> &mdash; held by Lemon Squeezy as
            seller of record, for as long as tax law requires them (generally
            several years). Deleting your Assay account does not erase these,
            because we aren&rsquo;t permitted to destroy them.
          </li>
          <li>
            <strong>Anonymous scan statistics</strong> &mdash; kept indefinitely.
            They contain no URL, no address, and no account, so there is nothing
            in them to connect to you.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can ask us to give you a copy of your data, correct it, export it,
          delete it, or restrict what we do with it. You can also object to any
          processing we do on the basis of legitimate interests. Email{" "}
          <a href="mailto:hello@assaysecurity.com">hello@assaysecurity.com</a> and
          we&rsquo;ll act on it within 30 days. It&rsquo;s free, and we won&rsquo;t
          ask why.
        </p>
        <p>
          <strong>
            If you are in the EEA or the UK and think we&rsquo;ve handled your
            data badly, you can complain to your national data protection
            authority
          </strong>{" "}
          &mdash; you don&rsquo;t have to come to us first, though we&rsquo;d
          rather you did so we can fix it. If you are in California, the CCPA
          gives you comparable rights, and we don&rsquo;t sell or share personal
          information as it defines those terms.
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
          <a href="mailto:hello@assaysecurity.com">hello@assaysecurity.com</a>. Assay is operated
          by <strong>Aynur Əliyeva</strong>, based in Baku, Azerbaijan Republic,
          who is the data controller for the information described above.
        </p>
      </section>
    </LegalDoc>
  );
}
