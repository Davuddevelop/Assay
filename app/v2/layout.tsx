import { NavV2, FooterV2 } from "@/components/landing-v2/chrome";

/**
 * v2 lives outside the (marketing) group on purpose: the glass pill nav and the
 * existing footer are the loudest part of the old look, and a sharper page
 * fighting them would only prove that the chrome wins.
 *
 * The ground is a step below the app's onyx — at this contrast the hairlines
 * that carry the whole layout stay visible without being drawn brighter.
 */
export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-[#08080a]">
      <NavV2 />
      <main className="flex-1">{children}</main>
      <FooterV2 />
    </div>
  );
}
