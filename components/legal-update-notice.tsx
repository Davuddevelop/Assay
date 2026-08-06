import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { acceptCurrentTerms } from "@/app/(app)/legal/actions";
import { requireUser } from "@/lib/auth";
import { acceptedVersion } from "@/lib/data/legal";
import { needsAcceptance, BINDING_DOCUMENTS } from "@/lib/legal";

/**
 * Shown to a signed-in user whose recorded acceptance isn't the current
 * version — someone who signed up before a document changed, or before there
 * was any record at all.
 *
 * A banner rather than a blocking modal, and that is the deliberate part.
 * "Continued use means you accept the updated terms" is already in the Terms,
 * so locking someone out of a report they paid for until they click a button
 * buys nothing legally and costs a session. What the button buys is a dated
 * row saying they saw this wording, which is worth having and isn't worth
 * holding anyone hostage for.
 *
 * It sits in the app layout, above the page, so it can't be missed the way a
 * footer link is — the same reasoning as the notice at sign-in.
 */
export async function LegalUpdateNotice() {
  const user = await requireUser();
  const accepted = await acceptedVersion(user.id);
  if (!needsAcceptance(accepted)) return null;

  return (
    <div className="border-b border-line bg-surface/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm leading-relaxed text-ivory-dim">
          {accepted === null
            ? "We've published our terms in full — including new license and copyright policies."
            : "We've updated our terms."}{" "}
          Please have a look at the{" "}
          {BINDING_DOCUMENTS.map((doc, i) => (
            <span key={doc.slug}>
              {i > 0 && (i === BINDING_DOCUMENTS.length - 1 ? " and " : ", ")}
              <Link
                href={doc.slug}
                className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
              >
                {doc.title}
              </Link>
            </span>
          ))}
          .
        </p>
        <form action={acceptCurrentTerms} className="shrink-0">
          <SubmitButton variant="ghost" size="sm" pendingText="Saving…">
            I&rsquo;ve read them
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
