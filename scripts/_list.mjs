import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const cls = Number(process.argv[2]||10);
const { data: ch, error } = await s.from("chapters")
  .select("id, chapter_code, title, order, book:books(class:classes(number), subject:subjects(slug))");
if (error) { console.error(error); process.exit(1); }
const rows = ch.filter(c=>c.book?.class?.number===cls)
  .sort((a,b)=> (a.book.subject.slug).localeCompare(b.book.subject.slug) || a.order-b.order);
for (const c of rows) console.log((c.book.subject.slug||"").padEnd(20), (c.chapter_code||"").padEnd(10), c.title);
