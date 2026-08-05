import type { Metadata } from "next";

import { Eyebrow } from "@/components/section-heading";
import { GuideFooter } from "@/components/guide-footer";
import { guideBySlug } from "@/lib/guides";

const SLUG = "which-supabase-keys-are-safe-in-the-browser";
const guide = guideBySlug(SLUG)!;

export const metadata: Metadata = {
  alternates: { canonical: `/guides/${SLUG}` },
  title: guide.title,
  description: guide.summary,
};

export default function Page() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Eyebrow label="Guide" />
      <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ivory">
        {guide.title}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ivory-dim">
        Supabase gives you two keys that look almost identical. One is supposed
        to be in your app where anyone can read it. The other ends your security
        model the moment it ships. Telling them apart takes ten seconds.
      </p>

      <div className="mt-14 space-y-5 text-base leading-relaxed text-ivory-dim">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          The short version
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pb-3 pr-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
                  Key
                </th>
                <th className="pb-3 pr-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
                  In the browser?
                </th>
                <th className="pb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
                  What it can do
                </th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-line/70">
                <td className="py-4 pr-4 font-mono text-xs text-ivory">anon</td>
                <td className="py-4 pr-4 text-ivory">Yes — by design</td>
                <td className="py-4">
                  Exactly what your Row Level Security policies allow, and
                  nothing more.
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-4 font-mono text-xs text-oxblood-soft">
                  service_role
                </td>
                <td className="py-4 pr-4 text-oxblood-soft">Never</td>
                <td className="py-4">
                  Everything. It bypasses RLS entirely — read, edit and delete
                  any row in any table.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          Why the anon key being public is fine
        </h2>
        <p>
          This trips people up, because it looks like a secret. It isn&rsquo;t.
          The anon key only says <em>which project</em> you&rsquo;re talking to.
          What you&rsquo;re allowed to do once connected is decided entirely by
          Row Level Security, on the server, per table, per row.
        </p>
        <p className="border-l-2 border-border-strong pl-5 text-ivory">
          Which is why the anon key being public and RLS being off is the
          dangerous combination — not either one alone. The key is the door
          handle. RLS is the lock.
        </p>
        <p>
          If your RLS policies are right, someone copying your anon key out of
          your JavaScript gets nothing they couldn&rsquo;t already see. If
          they&rsquo;re missing,{" "}
          <a
            href="/guides/why-lovable-apps-ship-with-the-database-open"
            className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
          >
            that key reads every row of every table
          </a>
          .
        </p>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          How to tell which one you shipped
        </h2>
        <p>
          Both are JWTs — three chunks separated by dots, starting{" "}
          <span className="font-mono text-sm text-ivory">eyJ</span>. You
          can&rsquo;t tell by looking at the start. The role is in the middle
          chunk.
        </p>
        <ol className="list-decimal space-y-3 pl-5 marker:font-mono marker:text-sm marker:text-ash">
          <li>Open your live app, press F12, go to the Network tab, reload.</li>
          <li>
            Find a request to{" "}
            <span className="font-mono text-sm text-ivory">*.supabase.co</span>{" "}
            and copy the long key from the{" "}
            <span className="font-mono text-sm text-ivory">apikey</span> header.
          </li>
          <li>
            Paste it into any JWT decoder, or just read the middle section. If
            it says{" "}
            <span className="font-mono text-sm text-ivory">
              &quot;role&quot;: &quot;anon&quot;
            </span>
            , you&rsquo;re fine. If it says{" "}
            <span className="font-mono text-sm text-oxblood-soft">
              &quot;role&quot;: &quot;service_role&quot;
            </span>
            , stop and read the next section.
          </li>
        </ol>
        <p className="text-sm text-ash">
          A faster tell, if you use Supabase&rsquo;s newer publishable/secret key
          format: anything beginning{" "}
          <span className="font-mono text-xs text-ivory">sb_secret_</span>{" "}
          belongs on a server and nowhere else.
        </p>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          If the service_role key shipped
        </h2>
        <p className="text-ivory">
          Treat it as compromised. It has been downloaded by every visitor and
          every crawler that has touched your site, and deleting the line from
          your code does not un-send it.
        </p>
        <ol className="list-decimal space-y-3 pl-5 marker:font-mono marker:text-sm marker:text-ash">
          <li>
            Supabase dashboard → Settings → API → roll the service_role key.
            Do this <em>first</em>. Until you do, everything else is decoration.
          </li>
          <li>
            Remove it from your frontend code, and move any call that needed it
            into an edge function or server route that reads it from an
            environment variable.
          </li>
          <li>
            Turn RLS on for every table holding personal data, on the assumption
            that someone already looked.
          </li>
          <li>
            Check your Supabase logs for requests you don&rsquo;t recognise. If
            personal data was reachable, you may have a disclosure obligation —
            that&rsquo;s a question for a lawyer, not a scanner.
          </li>
        </ol>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          Why AI builders get this wrong
        </h2>
        <p>
          Not carelessness — ambiguity. Ask for &ldquo;an admin page that lists
          all users&rdquo; and there are two correct answers: write an RLS policy
          granting an admin role, or use the key that ignores RLS. The second
          works immediately and the code looks clean. Nothing in the preview
          tells you the difference, because in the preview both do exactly what
          you asked.
        </p>
      </div>

      <GuideFooter slug={SLUG} />
    </div>
  );
}
