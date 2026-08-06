import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  alternates: { canonical: "/license" },
  title: "License Terms (EULA) — Assay",
  description:
    "What you may do with Assay, its reports, its paste-back fixes, and the hallmark — and what you may not.",
};

/**
 * The EULA.
 *
 * A classic end-user licence agreement covers software you install on your own
 * machine, and Assay is hosted — nothing is downloaded, so there is nothing to
 * licence in the traditional sense. Publishing a boilerplate installed-software
 * EULA would be pure theatre.
 *
 * What genuinely needs licence terms here is different, and none of it was
 * written down anywhere: who owns a report, whether a paste-back fix can be
 * used in paid client work, and on what terms someone may display the hallmark
 * on a site we don't control. The last one is a trademark question with real
 * consequences — the mark is the product's whole credibility, and a mark anyone
 * can display after it stops being true is worth nothing.
 */
export default function LicensePage() {
  return (
    <LegalDoc
      title="License Terms (EULA)"
      updated="August 2026"
      intro="Assay is a hosted service — there's nothing to install, so this isn't a licence for software on your computer. It's the part people actually need in writing: who owns a report, what you may do with the fixes we give you, and the rules for displaying the hallmark."
    >
      <section>
        <h2>1. What this covers</h2>
        <p>
          These License Terms are part of our{" "}
          <Link href="/terms">Terms of Service</Link> and apply whenever you use
          Assay. Where the two disagree about licensing or ownership, this
          document wins; for everything else, the Terms do.
        </p>
        <p>
          Nothing is installed on your device. You are not being granted a copy
          of any software, and no source code, model, or scanning logic is
          licensed to you.
        </p>
      </section>

      <section>
        <h2>2. Your licence to use Assay</h2>
        <p>
          While your account is in good standing, you get a{" "}
          <strong>
            personal, non-exclusive, non-transferable, revocable right to use
            Assay
          </strong>{" "}
          for your own apps and for client work you carry out. That right ends
          when your account does.
        </p>
        <p>You may not:</p>
        <ul>
          <li>
            resell, sublicense, or provide Assay to others as a scanning service
            of your own — running scans for your clients is fine, reselling
            access to the scanner is not;
          </li>
          <li>
            copy, scrape, or reverse-engineer the service, its checks, its
            detection patterns, or its prompts, or use it to build a competing
            scanner;
          </li>
          <li>
            use automated means to run scans beyond the documented API and your
            plan&rsquo;s limits, or work around rate limits and quotas;
          </li>
          <li>
            remove, obscure, or alter any attribution, notice, or date on a
            report, badge, or export.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Who owns what</h2>
        <ul>
          <li>
            <strong>Your app is yours.</strong> We claim no ownership of your
            app, your code, your content, or your data. Submitting a URL grants
            us permission to fetch and analyse what that URL already serves
            publicly, for the purpose of producing your report, and nothing
            more.
          </li>
          <li>
            <strong>Your reports are yours.</strong> You own the reports Assay
            generates for your apps and may keep, print, and share them —
            including sending them to a client as part of paid work. You do not
            need our permission and you owe us no fee for that.
          </li>
          <li>
            <strong>The fixes are yours to use.</strong> The paste-back prompts
            and code suggestions in a report are provided for you to use in your
            app, commercially, with no attribution required and no restriction
            on the resulting code.
          </li>
          <li>
            <strong>Assay is ours.</strong> The service, the checks, the
            wording of the explanations, the site, the name &ldquo;Assay&rdquo;,
            and the hallmark are ours and stay ours.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. About the fixes we suggest</h2>
        <p>
          Some explanations and suggested fixes are generated with the help of a
          large language model from your scan findings. They are{" "}
          <strong>suggestions, not reviewed engineering advice</strong>. They can
          be wrong, incomplete, or wrong for your particular setup.
        </p>
        <p>
          <strong>Read a suggested change before you apply it</strong>, and test
          it. You are responsible for what you ship. We give no warranty that a
          suggested fix will resolve an issue, that it will not break something
          else, or that it is suitable for your app.
        </p>
      </section>

      {/* The one section here with teeth. A mark that keeps saying "checked"
          after the app changed is worse than no mark: it is a false assurance
          shown to that freelancer's client. */}
      <section>
        <h2>5. The hallmark</h2>
        <p>
          If a scan passes, you may display the Assay hallmark and link to its
          badge page on the app that passed. That permission is{" "}
          <strong>limited, revocable, and specific</strong>:
        </p>
        <ul>
          <li>
            display it only on the app it was earned for, and only while the
            result it points to is still the latest one for that app;
          </li>
          <li>
            don&rsquo;t alter the mark — no recolouring, redrawing, cropping, or
            removing the link to the badge page;
          </li>
          <li>
            don&rsquo;t display it in a way that suggests Assay endorses,
            certifies, audits, or insures your app, or that it is secure. It
            means specific checks were run and passed on a specific date, which
            is what the badge page says;
          </li>
          <li>
            don&rsquo;t use the Assay name or mark in your own product name,
            logo, domain, or advertising without written permission.
          </li>
        </ul>
        <p>
          The badge page is served by us and reflects the current state. A mark
          can stop being valid without you doing anything — that is deliberate,
          and it is why the mark is worth showing. We may withdraw permission to
          display it at any time, and you agree to remove it promptly if we ask.
        </p>
      </section>

      <section>
        <h2>6. Feedback</h2>
        <p>
          If you send us an idea, a bug report, or a suggestion, we may use it
          to improve Assay without owing you anything for it. You keep whatever
          rights you already had in it; you are just not charging us for the
          suggestion.
        </p>
      </section>

      <section>
        <h2>7. No warranty, and limits</h2>
        <p>
          Assay is provided &ldquo;as is&rdquo;. It is a best-effort detection
          tool for known, mechanical misconfigurations — it is{" "}
          <strong>not a penetration test, not an audit, and not a
          certification</strong>, and a passing result is not a statement that
          your app is secure. The disclaimers, liability limits, and
          indemnities in the <Link href="/terms">Terms of Service</Link> apply
          to everything in this document and are not repeated here.
        </p>
      </section>

      <section>
        <h2>8. If this licence ends</h2>
        <p>
          If your account is closed or suspended, your right to use Assay and to
          display the hallmark ends immediately, and you must remove the mark
          from your app. Reports you already generated remain yours to keep and
          to use. Sections 3, 6 and 7 survive.
        </p>
      </section>
    </LegalDoc>
  );
}
