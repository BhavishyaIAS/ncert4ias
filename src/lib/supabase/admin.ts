import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. **SERVER ONLY.**
 *
 * Bypasses Row-Level Security, so it must never be imported into client code.
 * The `server-only` import above makes the build fail if that ever happens.
 * Use for privileged admin operations (bulk PYQ upload, seeding, etc.).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
