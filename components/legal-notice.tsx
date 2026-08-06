import Link from "next/link";
import { Fragment } from "react";

import { BINDING_DOCUMENTS, LEGAL_DOCUMENTS } from "@/lib/legal";
import { cn } from "@/lib/utils";

const PRIVACY = LEGAL_DOCUMENTS.find((d) => d.slug === "/privacy")!;

/**
 * The line that turns "we published terms" into "they agreed to them".
 *
 * Placed immediately next to the button that does the thing, never buried in
 * the footer. What makes an agreement stick is that a reasonable person saw
 * the notice at the moment they acted; a link in a footer three screens down
 * is the arrangement courts throw out.
 *
 * There is no checkbox on the sign-in form, and that's a decision rather than
 * an omission. The login page cannot tell a new account from a returning one
 * before submission — and it must not try, because "we know this address" is
 * an account-enumeration oracle the auth code deliberately avoids. So a
 * checkbox there would demand a tick from every returning user, every time,
 * for no added proof. The proof comes from lib/data/legal.ts recording the
 * version server-side when the session is created.
 *
 * Where an explicit tick does belong is the scan form, where the user is
 * asserting a fact only they know — that they own the app. That one is a real
 * checkbox.
 */
export function LegalNotice({
  action,
  className,
}: {
  /** Verb for the sentence — "continuing", "signing in", "scanning". */
  action: string;
  className?: string;
}) {
  return (
    <p
      // text-ivory-dim, not the text-ash this size of footnote uses elsewhere
      // on the site. Measured, ash on onyx at 12.75px is 4.45:1 against a
      // 4.5:1 requirement — a rounding error visually, but conspicuousness is
      // the entire test an agreement notice has to pass, and "we set the terms
      // in the faintest grey that fails WCAG" is not the sentence you want
      // read back to you. This lands at 9.06:1.
      className={cn(
        "text-xs leading-relaxed text-ivory-dim [&_a]:text-ivory [&_a]:underline [&_a]:decoration-line [&_a]:underline-offset-2 [&_a:hover]:decoration-ivory",
        className,
      )}
    >
      By {action} you agree to our{" "}
      {BINDING_DOCUMENTS.map((doc, i) => (
        <Fragment key={doc.slug}>
          {i > 0 && (i === BINDING_DOCUMENTS.length - 1 ? " and " : ", ")}
          <Link href={doc.slug}>{doc.title}</Link>
        </Fragment>
      ))}
      , and confirm you have read our{" "}
      <Link href={PRIVACY.slug}>{PRIVACY.title}</Link>.
    </p>
  );
}
