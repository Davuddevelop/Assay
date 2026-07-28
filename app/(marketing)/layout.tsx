import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { GradualBlur } from "@/components/gradual-blur";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      {/* Page-top frost: content dissolves as it scrolls under the floating nav.
          zIndex sits below the nav (z-30) so the pill stays crisp on top. */}
      <GradualBlur
        target="page"
        position="top"
        height="6rem"
        strength={2}
        divCount={6}
        curve="bezier"
        style={{ zIndex: 20 }}
      />
      <SiteNav />
      <main className="flex-1">{children}</main>
      {/* Lives here, not per-page: it was previously rendered by the landing
          page alone, so Privacy/Terms/Acceptable Use were unreachable from
          /try — the exact page where someone decides whether to trust us with
          their app's URL. */}
      <SiteFooter />
    </>
  );
}
