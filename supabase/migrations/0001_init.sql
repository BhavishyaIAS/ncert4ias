-- ===========================================================================
-- NCERT4IAS — M1 schema, RLS, auth wiring
-- Safe to re-run: uses IF EXISTS / IF NOT EXISTS and drops policies first.
-- Paste into the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Helper: updated_at (no table dependency, safe to define first)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, carries the role (student | admin)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'student' check (role in ('student','admin')),
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- is_admin() must be defined AFTER profiles exists: it's a SQL-language
-- function, so its body is validated against public.profiles at creation.
-- SECURITY DEFINER lets it read profiles without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admins from escalating their own role.
-- Only guards changes made by an authenticated *end-user* who is not an admin.
-- When auth.uid() is null (trusted server/superuser context — e.g. the initial
-- admin bootstrap, or the service-role key), the change is allowed.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Taxonomy: classes, subjects, books, chapters, gs_tags
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  number     int  not null unique check (number between 1 and 12),
  label      text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  ncert_name  text,
  code_prefix text not null,
  "order"     int  not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.books (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  class_id   uuid not null references public.classes(id)  on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  "order"    int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists books_class_idx   on public.books(class_id);
create index if not exists books_subject_idx on public.books(subject_id);

create table if not exists public.chapters (
  id               uuid primary key default gen_random_uuid(),
  book_id          uuid not null references public.books(id) on delete cascade,
  chapter_code     text not null unique,          -- e.g. H-8-3
  chapter_number   int  not null,
  title            text not null,
  official_pdf_url text,                           -- Read rung: official NCERT PDF
  "order"          int  not null default 0,
  status           text not null default 'draft' check (status in ('draft','published')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists chapters_book_idx   on public.chapters(book_id);
create index if not exists chapters_status_idx on public.chapters(status);

create table if not exists public.gs_tags (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,     -- GS-I .. GS-IV
  label   text not null,
  note    text,
  "order" int  not null default 0
);

create table if not exists public.chapter_gs_tags (
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  gs_tag_id  uuid not null references public.gs_tags(id)  on delete cascade,
  primary key (chapter_id, gs_tag_id)
);
create index if not exists chapter_gs_tags_tag_idx on public.chapter_gs_tags(gs_tag_id);

-- ---------------------------------------------------------------------------
-- Authored content (draft/publish + timestamps + author), keyed to chapter
-- ---------------------------------------------------------------------------
create table if not exists public.gists (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   uuid not null unique references public.chapters(id) on delete cascade,
  content_json jsonb,           -- TipTap document JSON
  content_html text,            -- rendered HTML for display
  status       text not null default 'draft' check (status in ('draft','published')),
  author_id    uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.mcqs (
  id            uuid primary key default gen_random_uuid(),
  chapter_id    uuid not null references public.chapters(id) on delete cascade,
  stem          text not null,
  options       jsonb not null check (jsonb_array_length(options) = 4),
  correct_index int  not null check (correct_index between 0 and 3),
  solution      text,
  difficulty    text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  source_note   text,
  status        text not null default 'draft' check (status in ('draft','published')),
  author_id     uuid references auth.users(id) on delete set null,
  "order"       int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists mcqs_chapter_idx on public.mcqs(chapter_id, status);

create table if not exists public.mains_questions (
  id                 uuid primary key default gen_random_uuid(),
  chapter_id         uuid not null references public.chapters(id) on delete cascade,
  question           text not null,
  model_answer_json  jsonb,
  model_answer_html  text,
  directive_word     text,
  word_limit         int,
  gs_paper           text check (gs_paper in ('GS-I','GS-II','GS-III','GS-IV','Essay')),
  status             text not null default 'draft' check (status in ('draft','published')),
  author_id          uuid references auth.users(id) on delete set null,
  "order"            int  not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists mains_chapter_idx on public.mains_questions(chapter_id, status);

-- ---------------------------------------------------------------------------
-- PYQs: bulk-uploaded, linked to one or more chapters via chapter_code
-- ---------------------------------------------------------------------------
create table if not exists public.pyqs (
  id            uuid primary key default gen_random_uuid(),
  year          int  not null,
  paper         text not null check (paper in ('Prelims','GS-I','GS-II','GS-III','GS-IV','Essay')),
  question_text text not null,
  notes         text,
  status        text not null default 'published' check (status in ('draft','published')),
  author_id     uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists pyqs_year_idx on public.pyqs(year);

create table if not exists public.pyq_chapters (
  pyq_id     uuid not null references public.pyqs(id)     on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  primary key (pyq_id, chapter_id)
);
create index if not exists pyq_chapters_chapter_idx on public.pyq_chapters(chapter_id);

-- updated_at triggers for all mutable content tables
do $$
declare t text;
begin
  foreach t in array array[
    'books','chapters','gists','mcqs','mains_questions','pyqs'
  ] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I;', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- ===========================================================================
-- Row-Level Security
--   * everyone can read taxonomy + PUBLISHED content
--   * admins can do everything
--   * students never see drafts
-- ===========================================================================
alter table public.profiles        enable row level security;
alter table public.classes         enable row level security;
alter table public.subjects        enable row level security;
alter table public.books           enable row level security;
alter table public.chapters        enable row level security;
alter table public.gs_tags         enable row level security;
alter table public.chapter_gs_tags enable row level security;
alter table public.gists           enable row level security;
alter table public.mcqs            enable row level security;
alter table public.mains_questions enable row level security;
alter table public.pyqs            enable row level security;
alter table public.pyq_chapters    enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select   on public.profiles;
drop policy if exists profiles_update   on public.profiles;
drop policy if exists profiles_insert   on public.profiles;
drop policy if exists profiles_delete   on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin())
             with check (id = auth.uid() or public.is_admin());
create policy profiles_insert on public.profiles
  for insert with check (public.is_admin());
create policy profiles_delete on public.profiles
  for delete using (public.is_admin());

-- Reusable pattern applied per table below.
-- Public-read taxonomy tables (classes, subjects, gs_tags, junctions):
do $$
declare t text;
begin
  foreach t in array array['classes','subjects','gs_tags','chapter_gs_tags','pyq_chapters'] loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('drop policy if exists %I_admin_all on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (true);', t, t);
    execute format('create policy %I_admin_all on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- books: public read (chapter-level status governs visibility of content)
drop policy if exists books_read on public.books;
drop policy if exists books_admin_all on public.books;
create policy books_read on public.books for select using (true);
create policy books_admin_all on public.books for all using (public.is_admin()) with check (public.is_admin());

-- Status-gated tables: chapters, gists, mcqs, mains_questions, pyqs
do $$
declare t text;
begin
  foreach t in array array['chapters','gists','mcqs','mains_questions','pyqs'] loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('drop policy if exists %I_admin_all on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (status = ''published'' or public.is_admin());', t, t);
    execute format('create policy %I_admin_all on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;
