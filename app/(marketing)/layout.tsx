import { SiteNav } from "@/components/site-nav";
import { ScrollProgress } from "@/components/scroll-progress";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main className="flex-1">{children}</main>
    </>
  );
}
