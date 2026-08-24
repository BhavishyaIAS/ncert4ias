import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { NavLinks } from "@/components/bhavishya/nav-links";
import { Seal } from "@/components/bhavishya/seal";

/**
 * Header for the bhavishya theme. Reads the session exactly the way the classic
 * header does — getProfile() — so auth behaviour is unchanged.
 */
export async function BhavishyaHeader() {
  const profile = await getProfile();

  return (
    <header className="bh-header">
      <div className="mx-auto flex min-h-16 w-full max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/" className="bh-wordmark flex items-center gap-2.5">
            <Seal />
            NCERT4IAS
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {profile?.role === "admin" && (
            <Link href="/admin" className="bh-btn bh-btn-bare">
              Admin
            </Link>
          )}

          {profile ? (
            <form action={signOut}>
              <button type="submit" className="bh-btn bh-btn-bare">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="bh-btn bh-btn-bare">
                Sign in
              </Link>
              <Link href="/signup" className="bh-btn bh-btn-primary !px-4 !py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
