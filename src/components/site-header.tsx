import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="border-b">
      <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold tracking-tight">
            NCERT<span className="text-muted-foreground">4</span>IAS
          </Link>
          <Link
            href="/browse"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Class-wise
          </Link>
          <Link
            href="/subjects"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Subject-wise
          </Link>
          <Link
            href="/search"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Search
          </Link>
        </div>

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
