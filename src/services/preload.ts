import { config } from "@/data/config";

/** Start loading the fastfetch logo at page load so `fastfetch` never waits on it. */
export function preloadAssets(): void {
  const logo = new Image();
  logo.src = config.logo.src;
}
