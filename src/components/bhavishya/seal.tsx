/**
 * The bow and arrow, from the logo.
 *
 * This mark appears in exactly two places in the entire product: here in the
 * header, and as the target the arrow lands in when a chapter is finished.
 * Scattering arrows, bows and seals through the rest of the UI would spend the
 * idea until it meant nothing. Do not add a third.
 */
export function Seal({ className }: { className?: string }) {
  return (
    <span className={`bh-seal ${className ?? ""}`} aria-hidden="true">
      <svg
        viewBox="0 0 40 40"
        width="18"
        height="18"
        fill="none"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* the bow */}
        <path d="M11 33 A22 22 0 0 0 33 11" strokeWidth="3.2" />
        {/* the arrow, drawn along its flight */}
        <path d="M11 33 L31 13" />
        <path d="M25 13 L31 13 L31 19" />
      </svg>
    </span>
  );
}
