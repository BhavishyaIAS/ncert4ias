import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;

/** The current authenticated user, or null. Revalidates the token. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The current user's profile row (includes role), or null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}

/**
 * Guard for admin-only pages/actions. Redirects to /login if signed out, or to
 * the home page if signed in without the admin role. Returns the profile.
 */
export async function requireAdmin(nextPath = "/admin"): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (profile.role !== "admin") {
    redirect("/?error=admin-only");
  }
  return profile;
}
