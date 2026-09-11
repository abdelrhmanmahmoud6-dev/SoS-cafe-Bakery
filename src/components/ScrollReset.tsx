"use client";

import { useEffect } from "react";

/**
 * Starts the storefront at the top on every load.
 *
 * Browsers restore the previous scroll position on reload by default, which on
 * a long single-page menu means reopening the site lands somewhere in the
 * middle of the grid. Switching restoration to manual and resetting to 0,0
 * makes a fresh load always open on the hero.
 *
 * A URL hash is respected: `/#menu` from a shared link or the nav should still
 * land on the menu, so the reset only runs when there is no hash.
 *
 * Note this is the belt, not the fix. The page was actively being scrolled down
 * on load by the category rail's `scrollIntoView` (see CategoryRail.tsx); that
 * was the root cause and is fixed there. This covers the separate, ordinary
 * case of the browser restoring a position the user left on their last visit.
 */
export function ScrollReset() {
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return null;
}
