import { getSubjectTheme, type PatternKey } from "@/lib/config/subject-themes";

/**
 * The seven subject textures. Pure SVG, rendered on the server — no client JS,
 * no hydration cost, nothing to load.
 *
 * Rules every pattern here obeys:
 *   • Ink hairlines only, plus EXACTLY ONE red mark. Red means "the active
 *     thing" everywhere else in this product, and decoration does not get to
 *     break that rule.
 *   • currentColor for the hairlines, so a pattern works on any ground.
 *   • No second hue, ever.
 */

const HAIR = { stroke: "currentColor", strokeWidth: 1, fill: "none", opacity: 0.22 };
const RED = { stroke: "var(--bh-red)", strokeWidth: 1.5, fill: "none" };

/** Chiselled horizontal rules with a red spine down the margin. */
function Inscription() {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={26} y1={8 + i * 13} x2={i % 3 === 0 ? 300 : 240} y2={8 + i * 13} {...HAIR} />
      ))}
      <line x1={14} y1={0} x2={14} y2={160} {...RED} />
    </>
  );
}

/** Construction grid with a drawn dimension mark. */
function Blueprint() {
  return (
    <>
      <rect width="100%" height="100%" fill="url(#bh-grid-11)" />
      <line x1={44} y1={30} x2={44} y2={130} {...HAIR} />
      <line x1={260} y1={30} x2={260} y2={130} {...HAIR} />
      <line x1={44} y1={80} x2={260} y2={80} {...RED} />
      <path d="M54 74 L44 80 L54 86" {...RED} />
      <path d="M250 74 L260 80 L250 86" {...RED} />
    </>
  );
}

/** Topographic strata, exactly one contour promoted. */
function Contour() {
  return (
    <>
      {Array.from({ length: 11 }, (_, i) => {
        const y = 168 - i * 15;
        const a = 20 + i * 3;
        return (
          <path
            key={i}
            d={`M-20 ${y} C 70 ${y - a}, 150 ${y + a * 0.5}, 220 ${y - a * 0.4} S 350 ${y + a * 0.3}, 420 ${y - a * 0.6}`}
            {...(i === 5 ? RED : HAIR)}
          />
        );
      })}
    </>
  );
}

/** Graph ruling, a column gutter, one hairline plot. */
function Ledger() {
  return (
    <>
      <rect width="100%" height="100%" fill="url(#bh-grid-9)" />
      <line x1={286} y1={0} x2={286} y2={160} stroke="currentColor" strokeWidth={1} opacity={0.4} />
      <line x1={291} y1={0} x2={291} y2={160} stroke="currentColor" strokeWidth={1} opacity={0.4} />
      <path d="M12 128 L52 112 L92 118 L132 82 L172 92 L212 50 L252 34" {...RED} />
    </>
  );
}

/** Concentric shells with a red nucleus. */
function Orbital() {
  return (
    <>
      {[22, 40, 58, 76, 94].map((r) => (
        <circle key={r} cx={150} cy={80} r={r} {...HAIR} />
      ))}
      <ellipse cx={150} cy={80} rx={94} ry={34} {...HAIR} />
      <circle cx={150} cy={80} r={4} fill="var(--bh-red)" stroke="none" />
    </>
  );
}

/** Pierced lattice, one rosette promoted. */
function Jaali() {
  return (
    <>
      <rect width="100%" height="100%" fill="url(#bh-jaali)" />
      <path d="M150 50 L180 80 L150 110 L120 80 Z" {...RED} />
    </>
  );
}

/** Leaf and watershed branching, with a red midrib. */
function Venation() {
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const y = 6 + i * 19;
        return (
          <g key={i}>
            <path d={`M150 ${y} C 110 ${y + 8}, 60 ${y + 18}, 8 ${y + 26}`} {...HAIR} />
            <path d={`M150 ${y} C 190 ${y + 8}, 240 ${y + 18}, 292 ${y + 26}`} {...HAIR} />
          </g>
        );
      })}
      <line x1={150} y1={0} x2={150} y2={160} {...RED} />
    </>
  );
}

const PATTERNS: Record<PatternKey, () => React.ReactElement | null> = {
  inscription: Inscription,
  blueprint: Blueprint,
  contour: Contour,
  ledger: Ledger,
  orbital: Orbital,
  jaali: Jaali,
  venation: Venation,
  plain: () => null,
};

/**
 * The texture for a subject, sized to fill its positioned container.
 * Decorative, so it is hidden from assistive technology.
 */
export function SubjectTexture({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const { pattern } = getSubjectTheme(slug);
  const Pattern = PATTERNS[pattern];
  if (pattern === "plain") return null;

  return (
    <svg
      className={`bh-texture ${className ?? ""}`}
      viewBox="0 0 300 160"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="bh-grid-11" width="11" height="11" patternUnits="userSpaceOnUse">
          <path d="M11 0 L0 0 L0 11" {...HAIR} />
        </pattern>
        <pattern id="bh-grid-9" width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M9 0 L0 0 L0 9" {...HAIR} />
        </pattern>
        <pattern id="bh-jaali" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M15 1 L29 15 L15 29 L1 15 Z" {...HAIR} />
          <path d="M15 8 L22 15 L15 22 L8 15 Z" {...HAIR} />
        </pattern>
      </defs>
      <Pattern />
    </svg>
  );
}
