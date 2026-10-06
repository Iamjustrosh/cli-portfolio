# Chapter 12 — Failure Modes & Edge Cases

> **What you'll be able to answer after this chapter:**
> What can go wrong at each layer? How are errors caught and presented? What happens with bad input, unavailable audio, network errors, and unexpected browser behaviors?

---

## Command Engine Failures

### Unknown Command

**Trigger:** Input string's first word is not in the registry.

**Behavior:** `execute()` returns `unknown(raw)`:
```ts
{ blocks: [{ type: "error", text: "command not found: <input>" }, { type: "text", tone: "muted", text: "use rosh -h or rosh --help …" }], actions: [] }
```

**Input truncation:** If the input is > 60 chars, it is truncated with `...`. This prevents a very long paste from flooding the error line.

**Note:** `null` from a registered command's `run()` also falls through to `unknown()`. The user sees the same error as if the command didn't exist — by design, since `null` means "I don't handle this invocation."

---

### Bad Arguments (known command)

**Trigger:** `ls`, `cat`, or `run` called with wrong argument count or unknown target.

**Behavior:** The command returns `fail(message)`:
```ts
{ blocks: [{ type: "error", text: "ls: nope: no such directory" }, { type: "text", tone: "muted", text: "use rosh -h or rosh --help …" }], actions: [] }
```

All error messages follow the real Unix shell format: `command: argument: problem`.

**Tested cases:**
- `ls` (no args) → "ls: missing directory"
- `ls a b` (too many args) → null → unknown command
- `ls nope` → "ls: nope: no such directory"
- `cat` → "cat: missing file name"
- `cat a b` → "cat: too many arguments"
- `cat nope.txt` → "cat: nope.txt: no such file"
- `run` → "run: missing target"
- `run a b` → "run: too many arguments"
- `run nope` → "run: nope: not found"

---

### Map Prototype Collision

**Potential issue:** If a user types `ls __proto__` or `ls constructor`, a plain-object lookup would return `Object.prototype.__proto__` or the constructor function, not `undefined`. This was a classic JavaScript prototype chain vulnerability.

**Mitigation:** `targets` and `files` in `ls.ts` and `cat.ts` are `new Map<string, …>()`, not `{}`. `Map.prototype.get("constructor")` returns `undefined` correctly.

**Tested in:** `tests/commands.test.ts:34`:
```ts
expect(text(execute("ls constructor").blocks)).toContain("no such directory");
```

---

## Audio Failures

### AudioContext Not Available

**Trigger:** Old browser, or privacy-focused browser that blocks Web Audio API.

**Behavior:** `getContext()` in `keySound.ts`:
```ts
const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
if (!Ctor) return null;
```
Returns `null`. `playKey()` silently returns. Terminal fully functional, no sound.

### Audio Files Missing or 404

**Trigger:** Wrong `config.keyboard.pack` name, or audio files not in `/public/audio/`.

**Behavior:** In `load()`:
```ts
const fetchBuffer = async (name: string): Promise<AudioBuffer | null> => {
  try {
    const response = await fetch(url(phase, name));
    if (!response.ok) return null;  // 404 → null
    return await decoder.decodeAudioData(await response.arrayBuffer());
  } catch { return null; }
};
```
All fetches that fail return `null`. `banks[phase].generic` becomes `[]`. `pick()` returns `undefined`. `playKey()` returns without playing. No console errors, no crashes.

### Lofi MP3 Missing

**Trigger:** `config.lofi.src` points to a nonexistent file.

**Behavior:** `el.addEventListener("error", () => { if (trackLoaded) setPlaying(false); })` — if the audio element errors after the src is swapped in, `setPlaying(false)` is called. The status bar stops showing "now playing". The `play()` promise rejection is caught by `.catch(() => setPlaying(false))`.

### AudioContext Suspended (autoplay policy)

**Trigger:** Even after gesture unlock, some browsers suspend AudioContext after a page visibility change.

**Behavior:** In `getContext()`:
```ts
if (context.state === "suspended") void context.resume();
```
`resume()` is called on every `playKey()` invocation. This handles the case where the context was suspended (e.g., tab was backgrounded). If `resume()` is still pending, `context.state` will be `"resuming"` and the sound might be missed — but this is a rare edge case and the fallback (silence) is safe.

### Lofi on iOS (volume ignored)

**Trigger:** iOS Safari ignores `HTMLAudioElement.volume` changes.

**Behavior:** Fades (`fadeTo()`) are no-ops — the volume value is set on the element, but iOS ignores it. The music plays at system volume. The fade-in and fade-out effects don't work, but the music itself plays correctly. `setPlaying()` state management still works.

---

## UI / React Failures

### React Strict Mode Double-Effect

**Trigger:** React Strict Mode (in development) runs `useEffect` twice to detect side effects.

**Behavior:** The boot sequence effect is fully cancellable:
```ts
return () => { cancelled = true; reset(); };
```
The first run's cleanup sets `cancelled = true` before the timeout fires. The second run finds `entryCountRef.current === 0` and starts fresh. The result is one correct boot sequence.

**Audio init:** `initAudio()` in `App.useEffect` is also idempotent — running it twice just registers gesture unlock listeners twice, but the `remove()` cleanup handles this correctly.

### Entry Memo and Stale Props

**Trigger:** A finished entry's blocks change (e.g., if data were mutated — which doesn't happen in this codebase).

**Behavior:** `Entry` is `memo`-wrapped. If props don't change (`visibleUnits = Infinity`, `entry` reference is stable), it doesn't re-render. Since `entries` is append-only and blocks are set once at creation, this is correct.

### submit() called while running

**Trigger:** A command finishes reveal and the next one is submitted before `status = "idle"` propagates (race condition).

**Behavior:** The first line of `submit()`:
```ts
if (statusRef.current === "running") return;
```
Uses a ref (not state) to check status synchronously. `statusRef.current` is updated before `setStatusState`, so this check is always current.

---

## Scroll Failures

### ResizeObserver not available

**Trigger:** Very old browser.

**Behavior:** `useStickToBottom` checks for `scroller` and `content` existence before setting up the observer. If `ResizeObserver` is not available, the `new ResizeObserver(follow)` call will throw. This is not explicitly caught — it would bubble to the `ErrorBoundary`. (This is a minor gap; `ResizeObserver` is widely supported since 2020.)

### User scrolls up, new content appears

**Trigger:** Visitor scrolls up to read past output, then a new command runs.

**Behavior:** `stick.current` is set to `false` when the user scrolls more than 48px from the bottom (via `onScroll`). New content does NOT auto-scroll. When the visitor submits the next command (`handleSubmit` calls `pin()`), `stick.current` is set to `true` and the view scrolls to bottom.

---

## Viewport / Mobile Failures

### visualViewport not available

**Trigger:** Old browser without `visualViewport` API.

**Behavior:** `useViewportHeight` checks:
```ts
const viewport = window.visualViewport;
if (!viewport) return;
```
Early return. The CSS fallbacks (`var(--app-top, 0px)` and `var(--app-height, 100dvh)`) apply. The terminal works but may be partially hidden by the on-screen keyboard on iOS.

### Pinch zoom

**Trigger:** Visitor pinch-zooms the terminal.

**Behavior:** `viewport.scale > 1.01` → CSS overrides are removed → the browser's native zoom layout takes over. The `--app-height` override is cleared so the terminal doesn't fight with the zoom. Behavior may be slightly off, but not broken.

---

## ErrorBoundary

**Trigger:** Any unhandled error thrown by a React component.

**Behavior:**
```tsx
componentDidCatch(error: Error, info: ErrorInfo) {
  console.error("terminal crashed:", error, info.componentStack);
}

render() {
  if (!this.state.failed) return this.props.children;
  return <div role="alert">…something went wrong…<a href={this.props.homeUrl}>main site</a></div>;
}
```

The terminal shows a plain error message with a link to the main site. The `homeUrl` is `config.mainSiteUrl`, which is the same URL `exit` would navigate to.

---

## localStorage Failures

**Trigger:** Private browsing mode (Safari), storage quota exceeded, or Content Security Policy blocking storage.

**Behavior:** All `localStorage` reads and writes are wrapped in `try/catch`:
```ts
export function readPrefs(): Prefs {
  try { … } catch { return { muted: false }; }
}
export function writePrefs(prefs: Prefs): void {
  try { … } catch { /* ignore */ }
}
```
The mute preference is not persisted, but the terminal works normally.

---

## Test Suite Coverage

The 12-file test suite covers:

| Test file | What it tests |
|-----------|--------------|
| `commands.test.ts` | All commands: argument validation, output shape, edge cases |
| `execute.test.ts` | Normalization (em dashes, whitespace, unknown commands) |
| `age.test.ts` | Birthday edge cases (before/on/after birthday, year boundary) |
| `keys.test.ts` | `classifyKey`, `classifyInputChange`, `isVirtualKey` |
| `keySound.test.ts` | Buffer selection, mute check, de-bounce, pitch randomization |
| `audioStore.test.ts` | State updates, subscriber notification, persistence |
| `leave.test.ts` | `beginLeaving`, `cancelLeaving`, `watchPageShow` |
| `terminal.test.tsx` | Full terminal integration: boot, submit, run, skip, clear |
| `a11y.test.tsx` | ARIA roles, live region, label presence |
| `normalMotion.test.tsx` | Animations fire with normal motion preference |
| `reducedMotion.test.tsx` | Animations skip with `prefers-reduced-motion` |
| `viewport.test.tsx` | CSS custom properties set/cleared by `useViewportHeight` |

**Running tests:**
```bash
bun run test   # or: npm test (runs: vitest run)
```

No watch mode is configured by default. Add `--watch` to the `test` script for watch mode.
