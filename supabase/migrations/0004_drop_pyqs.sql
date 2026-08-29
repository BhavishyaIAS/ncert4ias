-- ---------------------------------------------------------------------------
-- 0004_drop_pyqs — retire the PYQ rung
--
-- The platform is confined to four rungs: Read → Revise → Prelims → Mains.
-- The PYQ rung and its tables are removed everywhere in the application; this
-- migration removes them from the database schema too.
--
-- Dropping the tables also drops their indexes and RLS policies. `cascade`
-- clears the pyq_chapters -> pyqs foreign key regardless of drop order.
-- Idempotent: safe to re-run.
-- ---------------------------------------------------------------------------

drop table if exists public.pyq_chapters cascade;
drop table if exists public.pyqs cascade;
