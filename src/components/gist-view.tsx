"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a published gist's HTML for students, upgrading any embedded
 * `<pre data-type="mermaid">` blocks into rendered diagrams on the client.
 * Content is authored by the admin only, so the stored HTML is trusted.
 */
export function GistView({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;

    (async () => {
      const blocks = el.querySelectorAll('pre[data-type="mermaid"]');
      if (blocks.length === 0) return;
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

      for (const [i, block] of Array.from(blocks).entries()) {
        const code = block.textContent ?? "";
        try {
          const { svg } = await mermaid.render(
            `gist-mmd-${i}-${Math.random().toString(36).slice(2)}`,
            code,
          );
          if (cancelled) return;
          const wrap = document.createElement("div");
          wrap.className = "flex justify-center overflow-x-auto my-4";
          wrap.innerHTML = svg;
          block.replaceWith(wrap);
        } catch {
          // Leave the raw diagram source visible if it fails to render.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
