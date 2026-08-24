import Link from "next/link";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb trail. The last entry is the current page and is never a link.
 */
export function Crumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="bh-crumbs">
      {trail.map((c, i) => (
        <span key={`${c.label}-${i}`} className="contents">
          {i > 0 && (
            <span className="bh-sep" aria-hidden="true">
              /
            </span>
          )}
          {c.href ? (
            <Link href={c.href}>{c.label}</Link>
          ) : (
            <span aria-current="page">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
