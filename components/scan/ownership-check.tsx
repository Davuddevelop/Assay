import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The ownership attestation — the one thing in this product that only the user
 * can tell us.
 *
 * It was a sentence: "By scanning, you confirm you own this app." That is a
 * statement about the user rather than an act by the user, and CLAUDE.md §12
 * already records the consequence — somebody scanned google.com, because
 * nothing at any point asked them to say otherwise. A tick is not verification
 * either (§5 wants a meta tag, and that is still unbuilt), but it is the
 * difference between a claim we assumed and a claim they made.
 *
 * `required` on the input does the blocking in the browser; the server checks
 * it again, because a required attribute is a courtesy to honest users and
 * nothing at all to anyone else.
 *
 * Deliberately one sentence with one link. A wall of policy text next to a
 * checkbox is read by nobody, and an attestation nobody read is the thing we
 * were trying to stop having.
 */
export function OwnershipCheck({
  className,
  defaultChecked,
}: {
  className?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ivory-dim",
        className,
      )}
    >
      <input
        type="checkbox"
        name="owned"
        value="1"
        required
        defaultChecked={defaultChecked}
        // accent-color rather than a hand-drawn box: it keeps the native
        // control, so the keyboard behaviour, the focus ring and the
        // screen-reader announcement are the ones the browser already gets
        // right, and only the tick is ours.
        className="mt-0.5 h-4 w-4 shrink-0 accent-iris"
      />
      <span>
        I own this app, or I&rsquo;m authorised to test it.{" "}
        <Link
          href="/acceptable-use"
          className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
        >
          Why this matters
        </Link>
      </span>
    </label>
  );
}
