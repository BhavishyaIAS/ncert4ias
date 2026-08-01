/**
 * Official NCERT PDF URL helpers.
 *
 * NCERT hosts every textbook chapter as a PDF at a deterministic URL:
 *   https://ncert.nic.in/textbook/pdf/<bookCode><NN>.pdf
 * where <bookCode> identifies the book (e.g. "hess2" = Class 8 History,
 * "Our Pasts III") and <NN> is the 2-digit chapter number. The contents /
 * preliminary pages live at "<bookCode>ps.pdf".
 *
 * These are the official, free-for-education PDFs — we link to them, we never
 * copy their text (keeps us copyright-clean; see AGENTS.md §3).
 */

export const NCERT_PDF_BASE = "https://ncert.nic.in/textbook/pdf";

/** Direct URL to a chapter's official NCERT PDF. */
export function ncertPdfUrl(bookCode: string, chapterNumber: number): string {
  const nn = String(chapterNumber).padStart(2, "0");
  return `${NCERT_PDF_BASE}/${bookCode.toLowerCase()}${nn}.pdf`;
}

/** URL to a book's contents / preliminary pages PDF. */
export function ncertContentsUrl(bookCode: string): string {
  return `${NCERT_PDF_BASE}/${bookCode.toLowerCase()}ps.pdf`;
}
