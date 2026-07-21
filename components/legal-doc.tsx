import Link from "next/link";

/**
 * Shared chrome + typography for the legal pages (Terms, Privacy, Acceptable
 * Use). Pages pass plain semantic HTML as children; the arbitrary-variant
 * classes here style headings/paragraphs/lists so each page reads as clean
 * prose without repeating utilities.
 */
export function LegalDoc({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6 sm:py-24">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory"
      >
        ← Home
      </Link>

      <h1 className="mt-6 font-display text-4xl font-bold tracking-[-0.025em] text-ivory sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-ash">
        Last updated {updated}
      </p>
      <p className="mt-6 text-base leading-relaxed text-ivory-dim">{intro}</p>

      <article
        className="mt-12 space-y-8 text-sm leading-relaxed text-ivory-dim [&_a]:text-iris-soft [&_a:hover]:text-ivory [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-[-0.01em] [&_h2]:text-ivory [&_li]:ml-1 [&_p]:mt-3 [&_strong]:text-ivory [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
      >
        {children}
      </article>

      <p className="mt-14 border-t border-line pt-6 text-xs text-ash">
        Questions? Email{" "}
        <a href="mailto:hello@assay.dev" className="text-iris-soft hover:text-ivory">
          hello@assay.dev
        </a>
        .
      </p>
    </div>
  );
}
