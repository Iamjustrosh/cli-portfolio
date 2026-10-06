import { useAudio } from "@/hooks/useAudio";
import Container from "./Container";

/**
 * Slim, text-only status bar. No icons.
 * Right side: what is playing (when music is on) and the sound toggle.
 */
export default function StatusBar() {
  const { muted, playing, trackLabel, toggleMuted } = useAudio();

  return (
    <header className="shrink-0 border-b border-neutral-800 bg-neutral-900 pt-[env(safe-area-inset-top)]">
      <Container className="flex h-9 items-center justify-between gap-4 text-xs text-neutral-400">
        <span className="shrink-0">rosh@portfolio</span>
        <div className="flex min-w-0 items-center gap-4">
          {playing ? <span className="truncate">now playing: {trackLabel}</span> : null}
          <button
            type="button"
            onClick={toggleMuted}
            aria-pressed={!muted}
            aria-label="Toggle sound"
            className="h-full shrink-0 transition-colors hover:text-accent"
          >
            [sound: {muted ? "off" : "on"}]
          </button>
        </div>
      </Container>
    </header>
  );
}
