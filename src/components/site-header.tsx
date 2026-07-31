import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight">
          NCERT<span className="text-muted-foreground">4</span>IAS
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {profile?.role === "admin" && (
            <Button
              render={<Link href="/admin" />}
              variant="ghost"
              size="sm"
            >
              Admin
            </Button>
          )}

          {profile ? (
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          ) : (
            <>
              <Button
                render={<Link href="/login" />}
                variant="ghost"
                size="sm"
              >
                Sign in
              </Button>
              <Button render={<Link href="/signup" />} size="sm">
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
