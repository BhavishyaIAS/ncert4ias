"use client";

import { useEffect, useRef, useState } from "react";

let mermaidLoaded = false;

/**
 * Renders a single Mermaid diagram from its source. Used in the gist editor
 * (live preview) and the student Revise view. Mermaid is loaded lazily so it
 * never ships in the initial bundle.
 */
export function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mmd-${Math.random().toString(36).slice(2)}`;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        if (!mermaidLoaded) {
          mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
          mermaidLoaded = true;
        }
        if (!code.trim()) {
          if (!cancelled && ref.current) ref.current.innerHTML = "";
          setError(null);
          return;
        }
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Diagram error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
        Mermaid error: {error}
      </p>
    );
  }
  return <div ref={ref} className="flex justify-center overflow-x-auto" />;
}
