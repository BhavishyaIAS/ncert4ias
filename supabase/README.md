# Supabase — database & migrations

The SQL lives in [`migrations/`](./migrations), applied **in order**:

| File | What it does |
| ---- | ------------ |
| `0001_init.sql` | Full schema: profiles, taxonomy, content tables, triggers, and Row-Level Security. |
| `0002_seed_taxonomy.sql` | Seeds Classes 6–12, the four MVP subjects, and the GS-I…GS-IV tags. |
| `0003_promote_admin.sql` | Template to promote a signed-up user to `admin` (fill in the email). |
| `0004_drop_pyqs.sql` | Retires the PYQ rung: drops the `pyqs` and `pyq_chapters` tables. |

## Applying the schema (one-time)

Until the Supabase CLI is wired up, apply via the **SQL Editor**:

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. Paste the contents of `0001_init.sql`, run.
3. Paste the contents of `0002_seed_taxonomy.sql`, run.
4. Sign up in the app (`/signup`) with your admin email.
5. Paste `0003_promote_admin.sql` (with your email filled in), run.

All files are idempotent — safe to re-run.

## How auth roles work

- Every new `auth.users` row auto-gets a `public.profiles` row with
  `role = 'student'` (via the `on_auth_user_created` trigger).
- `is_admin()` is a `SECURITY DEFINER` helper used throughout RLS.
- A DB trigger blocks anyone but an admin from changing a profile's `role`,
  so students can't self-escalate.

## RLS summary

- **Taxonomy** (classes, subjects, books, gs_tags, junctions): world-readable.
- **Chapters & authored content** (gists, mcqs, mains): readable only when
  `status = 'published'`, unless you're an admin.
- **Writes** on everything: admin only.
