# NCERT4IAS

A production web platform that turns the NCERT textbooks (Classes 6–12) into a
structured **UPSC Civil Services prep engine**.

Every NCERT chapter is one **unit**. Each unit walks an aspirant up a fixed
**five-rung ladder**:

| Rung | Tab | What it is |
| ---- | ------- | ---------- |
| 1 | **Read** | The full NCERT chapter, via the official NCERT PDF (`ncert.nic.in`) |
| 2 | **Revise** | A clutter-free key-note gist of the chapter |
| 3 | **Prelims** | UPSC-style MCQs with answer key + solutions |
| 4 | **Mains** | UPSC Mains questions with NCERT-grounded model answers |
| 5 | **PYQs** | Actual UPSC previous-year questions tagged to the chapter |

The chapter page always renders these in order: **Read → Revise → Prelims →
Mains → PYQs**.

## MVP scope

This first slice ships **four subjects** across **Classes 6–12**:

- History
- Polity
- Geography
- Economy

Science, Math, and other subjects are intentionally **not** built yet. The data
model and content pipeline are structured so that adding a subject later is a
**config change** (`src/lib/config/subjects.ts`), not a rewrite.

## Content sourcing (copyright-clean by design)

- **Full chapters (Read):** we never scrape or store NCERT text. Each chapter
  stores a link to the **official NCERT PDF**, which the Read tab embeds/opens.
- **Gists, MCQs, Mains answers:** original derivative educational content we
  author. AI-assisted, **human-reviewed** — an admin clicks _"Draft with AI"_
  (a **server-side** Anthropic call), edits in TipTap, then publishes. Students
  only ever see **published, reviewed** content.
- **PYQs:** bulk-uploaded by admin via Excel (SheetJS), linked to chapters by
  `chapter_code`.

## Tech stack

- **Next.js** (App Router, TypeScript) — v16
- **Tailwind CSS** (v4) + **shadcn/ui**
- **Supabase** — Postgres, Auth, Storage, Row-Level Security
- **TipTap** rich-text editor for admin authoring (Mermaid + YouTube nodes) —
  _added in M3_
- **SheetJS** for bulk Excel PYQ parsing — _added in M6_
- **Anthropic API** via a server-side route for admin content drafting — never
  called from the client
- **Vercel** for deployment

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    then fill in Supabase + Anthropic values

# 3. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

See [`.env.example`](./.env.example). Summary:

| Variable | Scope | Purpose |
| -------- | ----- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Public anon key (RLS-guarded) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Privileged admin operations |
| `ANTHROPIC_API_KEY` | **server only** | "Draft with AI" route |
| `ANTHROPIC_MODEL` | server | Drafting model id |
| `NEXT_PUBLIC_SITE_URL` | client | Canonical site URL |

## Project structure

```
src/
  app/                      # Next.js App Router routes
  components/
    ui/                     # shadcn/ui primitives
  lib/
    config/
      subjects.ts           # subject registry — add a subject = config change
      taxonomy.ts           # classes, ladder rungs, GS tags, papers, statuses
    supabase/
      client.ts             # browser client (anon key)
      server.ts             # server client (session cookie, RLS applies)
      admin.ts              # service-role client (SERVER ONLY)
    utils.ts                # shadcn cn() helper
  types/
    database.ts             # generated Supabase types (populated in M1)
```

> **Note on Next.js 16:** this version renames the `middleware` file convention
> to `proxy`, and `cookies()`/`headers()` are async. Auth session refresh lands
> in `proxy.ts` during M1.

## Roadmap (milestones)

- **M0 — Scaffold** ✅ Next.js + TS + Tailwind + shadcn/ui, structure, env, README
- **M1 — Data & auth** — Supabase schema + RLS + student/admin auth + taxonomy seed
- **M2 — Chapters + Read** — taxonomy manager, browse, embedded official-PDF Read tab
- **M3 — Revise** — gist model, TipTap editor, "Draft with AI", publish, student view
- **M4 — Prelims** — MCQ authoring + AI-assist, answer-reveal practice
- **M5 — Mains** — Mains Q + model-answer authoring + AI-assist, student view
- **M6 — PYQs** — SheetJS bulk upload keyed to `chapter_code`, upload log, payoff stat
- **M7 — GS lens + search** — GS-tag mapping, browse-by-GS, global search
- **M8 — Polish + deploy** — empty/loading/error states, mobile, deploy to Vercel
