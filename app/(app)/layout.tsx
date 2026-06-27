import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every page under (app) requires a signed-in user.
  await requireUser();

  return (
    <>
      <AppHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
