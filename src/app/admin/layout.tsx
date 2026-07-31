import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate: signed-in admins only. Redirects otherwise.
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
  );
}
