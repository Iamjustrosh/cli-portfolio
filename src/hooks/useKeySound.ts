import { useCallback, useRef, type KeyboardEvent } from "react";
import { config } from "@/data/config";
import { classifyInputChange, classifyKey, isVirtualKey } from "@/lib/keys";
import { playKey } from "@/services/keySound";

/**
 * Keyboard sound handlers for the prompt's real <input>.
 * This is the ONLY place key sounds are triggered: the scripted typing
 * (auto-run, click-to-run) and the terminal's output never reach it, which is
 * what guarantees "sound while you type, silence while it prints".
 */
export function useKeySound() {
  /** True while a virtual keyboard (Android) is in use: sound then comes from input changes. */
  const virtual = useRef(false);

  const keyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (isVirtualKey(event.key, event.nativeEvent.keyCode)) {
      virtual.current = true;
      return;
    }
    virtual.current = false;
    const kind = classifyKey(event.key);
    if (kind) playKey(kind, "press");
  }, []);

  const keyUp = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (!config.keyboard.playRelease || virtual.current) return;
    const kind = classifyKey(event.key);
    if (kind) playKey(kind, "release");
  }, []);

  const inputChange = useCallback((previous: string, next: string) => {
    if (!virtual.current) return;
    const kind = classifyInputChange(previous, next);
    if (kind) playKey(kind, "press");
  }, []);

  return { keyDown, keyUp, inputChange };
}
