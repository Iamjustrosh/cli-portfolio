import { useSyncExternalStore } from "react";
import { config } from "@/data/config";
import { getAudioState, subscribeAudio, toggleMuted } from "@/services/audioStore";

/** Shared audio state for the status bar. */
export function useAudio() {
  const { muted, playing } = useSyncExternalStore(subscribeAudio, getAudioState);
  return {
    muted,
    playing,
    trackLabel: `${config.lofi.title} by ${config.lofi.artist}`,
    toggleMuted,
  };
}
