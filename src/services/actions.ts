import type { Action } from "@/engine/types";
import { beginLeaving, prefersReducedMotion } from "./leave";
import { setKeyboardPack } from "./keySound";
import { playLofi, stopLofi } from "./lofi";
import { navigate } from "./navigate";

/** How long the page takes to fade out before a redirect. */
const FADE_MS = 550;

/**
 * Runs the real-world side effects an engine result asks for.
 * `clear` is handled by the terminal itself, so it is ignored here.
 * Must be called synchronously from the Enter/click handler.
 */
export function performAction(action: Action): void {
  switch (action.type) {
    case "open":
      window.open(action.url, "_blank", "noopener,noreferrer");
      break;
    case "download": {
      const link = document.createElement("a");
      link.href = action.href;
      link.download = action.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      break;
    }
    case "redirect":
      // Same-tab navigation is not subject to pop-up blocking, so a delay is safe.
      if (!action.delayMs) {
        navigate(action.url);
        break;
      }
      // Fade the page out so it finishes just as the redirect happens.
      if (!prefersReducedMotion()) {
        window.setTimeout(beginLeaving, Math.max(0, action.delayMs - FADE_MS));
      }
      window.setTimeout(() => navigate(action.url), action.delayMs);
      break;
    case "keyboard":
      void setKeyboardPack(action.pack);
      break;
    case "lofi":
      if (action.op === "play") playLofi();
      else stopLofi();
      break;
    case "clear":
      break;
  }
}
