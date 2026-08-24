import Link from "next/link";

/**
 * Loading, empty and error screens for the bhavishya theme.
 *
 * The rule these follow: an empty screen invites an action, and an error says
 * what happened and what to do next. Neither is allowed to be a shrug.
 */

/**
 * Loading. A skeleton of the page that is coming, not a spinner — a spinner
 * says "wait", a skeleton says "here is what you are about to read", which is
 * the more honest signal and the less anxious one.
 */
export function BhavishyaLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <p className="bh-eyebrow" role="status">
        Loading
      </p>
      <div className="mt-6 flex flex-col gap-4" aria-hidden="true">
        <div className="bh-skel" style={{ height: 44, width: "62%" }} />
        <div className="bh-skel" style={{ height: 18, width: "84%" }} />
        <div className="bh-skel" style={{ height: 18, width: "71%" }} />
        <div className="mt-4 flex flex-col gap-2">
          <div className="bh-skel" style={{ height: 52 }} />
          <div className="bh-skel" style={{ height: 52 }} />
          <div className="bh-skel" style={{ height: 52 }} />
        </div>
      </div>
    </main>
  );
}

export function BhavishyaNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24">
      <p className="bh-eyebrow">Error 404</p>
      {/* No decorative red rule here: red marks what is active or what to touch
          next, and on a dead end the only such thing is the button below. */}
      <h1 className="bh-h2 mt-4">This page isn’t here</h1>
      <p className="bh-lede mt-3 max-w-md">
        The link may be wrong, or the chapter may not be published yet. Both are
        recoverable.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/browse" className="bh-btn bh-btn-primary">
          Browse chapters
        </Link>
        <Link href="/search" className="bh-btn bh-btn-quiet">
          Search for a topic
        </Link>
      </div>
    </main>
  );
}
