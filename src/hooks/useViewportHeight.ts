import { useEffect } from "react";

/**
 * Keeps the app exactly as tall as the VISIBLE area.
 * iOS Safari does not shrink the layout when the on-screen keyboard opens (only
 * the visual viewport shrinks), which would hide the prompt behind the keyboard.
 * Sets --app-height and --app-top on <html>; the app shell uses them, falling
 * back to 100dvh when unset. While pinch-zoomed it steps aside.
 */
export function useViewportHeight(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;

    const apply = () => {
      if (Math.abs(viewport.scale - 1) > 0.01) {
        root.style.removeProperty("--app-height");
        root.style.removeProperty("--app-top");
        return;
      }
      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.style.setProperty("--app-top", `${viewport.offsetTop}px`);
    };

    apply();
    viewport.addEventListener("resize", apply);
    viewport.addEventListener("scroll", apply);
    return () => {
      viewport.removeEventListener("resize", apply);
      viewport.removeEventListener("scroll", apply);
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--app-top");
    };
  }, []);
}
