import type { Metadata } from "next";
import Link from "next/link";

import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  alternates: { canonical: "/dmca" },
  title: "Copyright & DMCA Policy — Assay",
  description:
    "How to report copyright infringement on assaysecurity.com, how to file a counter-notice, and what Assay does about repeat infringers.",
};

/**
 * The takedown procedure.
 *
 * Worth being precise about what this can and can't be. Assay hosts very
 * little that a user supplies: a public badge page carries an app URL and a
 * verdict, and a report carries findings we wrote. So the realistic complaint
 * is not "you are hosting my film", it is "a page on your domain names my app"
 * — and the honest thing is to name a route for that rather than publish a
 * film-industry takedown form and pretend it fits.
 *
 * Note also what this page does NOT claim: the DMCA safe harbour requires
 * registering a designated agent with the US Copyright Office, which is a
 * separate act from publishing a policy. Nothing here asserts we have it.
 */
export default function DmcaPage() {
  return (
    <LegalDoc
      title="Copyright & DMCA Policy"
      updated="August 2026"
      intro="Assay respects copyright. This explains what we host, how to tell us something on our site infringes your rights, how to dispute a takedown, and what happens to accounts that keep doing it."
    >
      <section>
        <h2>1. What Assay actually hosts</h2>
        <p>
          Almost nothing that a user uploads. There is no file upload, no image
          hosting, no comments, and no publishing tool. What exists is:
        </p>
        <ul>
          <li>
            <strong>Reports</strong> — written by us from what your app already
            serves publicly. Private to your account unless you print or share
            them yourself.
          </li>
          <li>
            <strong>Badge pages</strong> — a page on our domain, created when
            you mint a mark, showing an app URL, a date, and a verdict. No
            findings, no page content, no code.
          </li>
          <li>
            <strong>Account details</strong> — your email address or GitHub
            handle.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> host your app, your code, or your users&rsquo;
          data. If your complaint is about the content of an app we scanned, the
          place to send it is that app&rsquo;s own host — not us.
        </p>
      </section>

      <section>
        <h2>2. Reporting infringement</h2>
        <p>
          If you believe material on <strong>assaysecurity.com</strong> infringes
          a copyright you own or represent, email{" "}
          <a href="mailto:hello@assaysecurity.com">hello@assaysecurity.com</a>{" "}
          with <strong>&ldquo;Copyright notice&rdquo;</strong> in the subject
          line. To let us act on it, include all of the following:
        </p>
        <ul>
          <li>your name, address, telephone number, and email address;</li>
          <li>
            identification of the work you say is infringed — if several, a
            representative list;
          </li>
          <li>
            the <strong>exact URL</strong> on our site of the material you want
            removed, specific enough that we can find it without guessing;
          </li>
          <li>
            a statement that you have a good-faith belief the use is not
            authorised by the copyright owner, its agent, or the law;
          </li>
          <li>
            a statement that the information in your notice is accurate, and —
            under penalty of perjury — that you are the owner or authorised to
            act for the owner;
          </li>
          <li>your physical or electronic signature.</li>
        </ul>
        <p>
          These are the elements US law (17 U.S.C. &sect; 512(c)(3)) requires. A
          notice missing them may be unenforceable, and we may not be able to
          act on it. We usually acknowledge within a few working days; Assay is
          run by one person, so please allow for that rather than assuming
          silence.
        </p>
        <p>
          <strong>
            Knowingly misrepresenting that material is infringing carries
            liability under 17 U.S.C. &sect; 512(f)
          </strong>{" "}
          — including for the other side&rsquo;s legal costs. Don&rsquo;t use a
          copyright notice to get a page taken down for another reason.
        </p>
      </section>

      <section>
        <h2>3. What we do about it</h2>
        <p>
          If a notice is valid we remove or disable access to the material
          promptly, and tell the affected account holder what was removed and
          why, giving them a copy of the notice. If we remove a badge page, the
          mark it displayed stops resolving on the app that embedded it.
        </p>
      </section>

      <section>
        <h2>4. Counter-notice</h2>
        <p>
          If your material was removed and you believe that was a mistake or a
          misidentification, reply to us with a counter-notice containing:
        </p>
        <ul>
          <li>your name, address, telephone number, and email address;</li>
          <li>
            identification of the material and the URL where it appeared before
            removal;
          </li>
          <li>
            a statement, under penalty of perjury, that you have a good-faith
            belief it was removed as a result of a mistake or misidentification;
          </li>
          <li>
            your consent to the jurisdiction of a federal court where you live,
            or — if you are outside the United States — any judicial district in
            which we may be found, and that you will accept service from the
            person who filed the notice;
          </li>
          <li>your physical or electronic signature.</li>
        </ul>
        <p>
          We may forward your counter-notice, including your contact details, to
          the person who filed the original notice — that is how the process
          works, so send only what you are willing to have passed on. Where the
          law requires it, we may restore the material after 10&ndash;14
          business days unless we are told court proceedings have begun.
        </p>
      </section>

      <section>
        <h2>5. Repeat infringers</h2>
        <p>
          We terminate, in appropriate circumstances, the accounts of users who
          repeatedly infringe copyright. This sits alongside our{" "}
          <Link href="/acceptable-use">Acceptable Use Policy</Link>, which
          separately allows us to suspend accounts for scanning apps they
          don&rsquo;t own.
        </p>
      </section>

      <section>
        <h2>6. Trademarks, and other complaints</h2>
        <p>
          For a trademark complaint, a privacy or personal-data request, or a
          badge page you say misrepresents your app, email the same address
          describing the problem and the exact URL. Data-protection requests are
          handled under our <Link href="/privacy">Privacy Policy</Link>; you
          don&rsquo;t need to use this procedure for those.
        </p>
        <p>
          Use of the Assay name and hallmark is governed by our{" "}
          <Link href="/license">License Terms</Link>.
        </p>
      </section>

      <section>
        <h2>7. Scope</h2>
        <p>
          Assay is operated by <strong>Aynur Əliyeva</strong> from Baku,
          Azerbaijan Republic. We follow the notice-and-takedown procedure above
          because it is a fair and well-understood process, and we apply it to
          complaints from anywhere. Doing so is not an admission that any
          particular country&rsquo;s law governs us, and it does not waive any
          defence available to us.
        </p>
      </section>
    </LegalDoc>
  );
}
