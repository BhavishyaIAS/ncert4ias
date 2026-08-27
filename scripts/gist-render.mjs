// Shared renderer that turns the structured gist / mains JSON authoring format
// into the trusted HTML fragments stored in `gists.content_html` and
// `mains_questions.model_answer_html`. Both loaders (load-gists.mjs,
// load-mains.mjs) import from here so authoring stays clean and consistent.
//
// Inline markup supported inside any text string:
//   **bold**   -> <strong>
//   *italic*   -> <em>
// HTML is escaped first, so authored text never needs manual entity encoding.

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function renderTable(table) {
  const head = table.columns.map((c) => `<th>${inline(c)}</th>`).join("");
  const body = table.rows
    .map(
      (r) => `<tr>${r.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// One bullet: a plain string, or { text, sub:[...] } for a nested list.
function renderPoint(p) {
  if (typeof p === "string") return `<li>${inline(p)}</li>`;
  const sub = p.sub
    ? `<ul>${p.sub.map((s) => `<li>${inline(s)}</li>`).join("")}</ul>`
    : "";
  return `<li>${inline(p.text)}${sub}</li>`;
}

// A gist section: heading + optional intro paragraph + bullets + optional
// table + optional mermaid diagram.
function renderSection(sec) {
  const parts = [`<h2>${inline(sec.heading)}</h2>`];
  if (sec.intro) parts.push(`<p>${inline(sec.intro)}</p>`);
  if (sec.points && sec.points.length)
    parts.push(`<ul>${sec.points.map(renderPoint).join("")}</ul>`);
  if (sec.table) parts.push(renderTable(sec.table));
  if (sec.mermaid)
    parts.push(`<pre data-type="mermaid">${esc(sec.mermaid)}</pre>`);
  return parts.join("");
}

/** Render a full gist document (structured JSON) to a trusted HTML fragment. */
export function renderGist(gist) {
  const parts = [];
  const lead = [
    "Exam-Ready Quick Revision Gist (UPSC CSE)",
    gist.source ? ` — ${gist.source}` : "",
  ].join("");
  parts.push(`<p><em>${inline(lead)}</em></p>`);
  for (const sec of gist.sections) parts.push(renderSection(sec));
  return parts.join("");
}

// One block inside a Mains model answer.
//   "string"                 -> <p>…</p>
//   { h: "…" }               -> <p><strong>…</strong></p>   (sub-heading)
//   { lead: "…", text: "…" } -> <p><strong>lead</strong> text</p>
//   { list: [ … ] }          -> <ul><li>…</li></ul>
function renderAnswerBlock(b) {
  if (typeof b === "string") return `<p>${inline(b)}</p>`;
  if (b.h) return `<p><strong>${inline(b.h)}</strong></p>`;
  if (b.list)
    return `<ul>${b.list.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
  if (b.lead !== undefined)
    return `<p><strong>${inline(b.lead)}</strong> ${inline(b.text)}</p>`;
  return `<p>${inline(b.text ?? "")}</p>`;
}

/** Render a Mains model answer (array of blocks) to a trusted HTML fragment. */
export function renderAnswer(blocks) {
  return blocks.map(renderAnswerBlock).join("");
}
