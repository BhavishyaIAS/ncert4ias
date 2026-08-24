import { getTheme } from "@/lib/theme.server";

/**
 * Picks which tree a route renders. Both branches are passed as elements, so
 * only the selected one is ever rendered — the other is never invoked and costs
 * nothing.
 *
 * Usage in a page, which keeps the original component intact and un-rewritten:
 *
 *   function ClassicThing(props) { ...the existing body, untouched... }
 *
 *   export default function Thing(props) {
 *     return <ThemedPage
 *              classic={<ClassicThing {...props} />}
 *              bhavishya={<BhavishyaThing {...props} />} />;
 *   }
 */
export async function ThemedPage({
  classic,
  bhavishya,
}: {
  classic: React.ReactNode;
  bhavishya: React.ReactNode;
}) {
  const theme = await getTheme();
  return theme === "bhavishya" ? bhavishya : classic;
}
