import { primeLofi } from "./lofi";
import { prefetchKeySounds, unlockKeySounds } from "./keySound";

const GESTURES = ["click", "touchend", "keydown"] as const;

/**
 * Call once at startup. Starts loading the key sounds, and on the first user
 * gesture unlocks audio for both the key sounds and the lofi player.
 * Returns a cleanup function.
 */
export function initAudio(): () => void {
  prefetchKeySounds();

  const remove = () => GESTURES.forEach((type) => window.removeEventListener(type, unlock, true));
  function unlock() {
    unlockKeySounds();
    primeLofi();
    remove();
  }
  GESTURES.forEach((type) => window.addEventListener(type, unlock, true));
  return remove;
}
