const ATTRIBUTE = "leaving";

/** Fades the whole page out (CSS in index.css reacts to this attribute). */
export function beginLeaving(): void {
  document.documentElement.dataset[ATTRIBUTE] = "true";
}

export function cancelLeaving(): void {
  delete document.documentElement.dataset[ATTRIBUTE];
}

/**
 * If the visitor comes back with the browser's Back button, the page can be
 * restored from cache still faded out. Undo that.
 */
export function watchPageShow(): () => void {
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) cancelLeaving();
  };
  window.addEventListener("pageshow", onPageShow);
  return () => window.removeEventListener("pageshow", onPageShow);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
