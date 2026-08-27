"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/browse", label: "Class-wise" },
  { href: "/subjects", label: "Subject-wise" },
  { href: "/search", label: "Search" },
];

/**
 * Primary nav. The current section is marked in red — the palette's whole rule
 * is that red says "you are here", so this is the one place it belongs in the
 * header.
 */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map(({ href, label }) => {
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className="bh-navlink"
            aria-current={current ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
