import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const cls = Number(process.argv[2]||10);
const { data: ch } = await s.from("chapters").select("id, chapter_code, book:books(class:classes(number))");
const rows = ch.filter(c=>c.book?.class?.number===cls);
const ids = rows.map(c=>c.id);
const { data: g } = await s.from("gists").select("chapter_id").in("chapter_id", ids);
const { data: m } = await s.from("mains_questions").select("chapter_id").in("chapter_id", ids);
const gset = new Set(g.map(x=>x.chapter_id)), mset = new Set(m.map(x=>x.chapter_id));
let missG=[], missM=[];
for (const c of rows){ if(!gset.has(c.id)) missG.push(c.chapter_code); if(!mset.has(c.id)) missM.push(c.chapter_code); }
console.log(`Class ${cls}: ${rows.length} chapters | gists ${gset.size} | mains-chapters ${mset.size}`);
console.log("missing gist:", missG.join(",")||"none");
console.log("missing mains:", missM.join(",")||"none");
