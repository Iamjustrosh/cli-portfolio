# Chapter 14 — Glossary

Every domain term and codebase-specific abbreviation, defined on first use.

---

## A

**Action** — A typed data object returned by the command engine (alongside blocks) representing a browser side effect to perform: `open`, `download`, `redirect`, `lofi`, or `clear`. Actions are not function calls — they are data. See `src/engine/types.ts:37-42`.

**AudioContext** — The Web Audio API's central object for audio processing. Must be created or resumed in response to a user gesture (click, keydown, touchend). Created lazily in `src/services/keySound.ts` by `getContext()`.

**audioStore** — A module-level singleton (outside React) that holds the shared audio state (`muted`, `playing`). Components subscribe via `useSyncExternalStore`. See `src/services/audioStore.ts`.

---

## B

**Bank** — In `keySound.ts`, a collection of decoded `AudioBuffer` objects for one phase (press or release). Contains `generic[]` (the pool of GENERIC sounds) and `special` (Enter, Backspace, Space).

**Block** — The atomic unit of terminal output. A typed data object: `text`, `error`, `list`, `json`, `fastfetch`, or `spacer`. Produced by commands, rendered by block components. See `src/engine/types.ts:19-31`.

**BlockRenderer** — The dispatch component (`src/components/blocks/BlockRenderer.tsx`) that routes each block to its specific renderer based on `block.type`.

**Boot sequence** — The automatic run of `rosh --help` 450ms after the page loads. Implemented in `useTerminal`'s `useEffect`. Waits for fonts, then types the command character-by-character. Skips if the user has already acted.

---

## C

**Command** — A named, self-describing unit that parses `(args, context)` and returns `ExecResult | null`. Each command has a `name`, `usages` (for help), and a `run()` function. See `src/engine/types.ts:62-67`.

**CommandLine** — The React component (`src/components/terminal/CommandLine.tsx`) that displays a past command in "scrollback" — static text that will never change.

**Context** (`ExecContext`) — A snapshot of ambient state (currently: audio playing/muted) passed into `execute()` at call time so commands can read external state without coupling the engine to any services. See `src/engine/types.ts:45-47`.

**Cursor** — The block cursor displayed in the `Prompt`. Three states: `blink` (focused/idle), `solid` (scripted typing in progress), `hollow` (page unfocused). Implemented as a CSS `animation` in `index.css` and a tiny `Cursor.tsx` component.

---

## D

**`data-leaving`** — An attribute added to `document.documentElement` by `beginLeaving()` when the `exit` command is running. Triggers a CSS `opacity: 0` transition on `#root`. Removed by `cancelLeaving()` if the visitor returns via the Back button.

**`domAnimation`** — The lazy-loaded subset of `motion/react` features used by the app. Includes basic opacity and transform animations. Loaded via `LazyMotion` in `App.tsx` to keep the main bundle small.

---

## E

**`em dash` / `en dash` fix** — In `normalize()`, Unicode em dash (U+2014) and en dash (U+2013) are replaced with `--`. Mobile keyboards auto-convert `--` to `—`, breaking flags like `--help`. This replacement corrects the input before parsing.

**Entry** — One command run and its output, stored as `{ id, command, blocks }` in the `entries` array in `useTerminal`. Rendered by the `Entry` React component (memoised). Entries are append-only; `clear` replaces the array with `[]`.

**EntryData** — The TypeScript interface for an entry stored in React state. See `src/hooks/useTerminal.ts:17-21`.

**ExecContext** — See *Context*.

**ExecResult** — `{ blocks: Block[]; actions: Action[] }`. The return value of every command run. See `src/engine/types.ts:49-52`.

**`execute()`** — The engine's entry point. Normalizes input, splits into command name and args, looks up the command in the registry, calls `run()`, and returns the result (or an unknown-command error). See `src/engine/execute.ts`.

---

## F

**`fail()`** — A helper in `src/engine/commands/helpers.ts` that returns an `ExecResult` with an error block and a hint block. Used by all commands for semantic errors (wrong argument, unknown file).

**Fastfetch** — A Linux command-line tool that prints system info next to an ASCII art logo. This portfolio mimics its output format in the `fastfetch` block type. The `fastfetch` command builds this block from `profile.ts` and `config.ts`.

**`files` map** — In `cat.ts`, a `Map<string, () => Block[]>` mapping known filenames (`experience.txt`, `stack.json`, etc.) to builder functions. Looked up before the project-slug fallback.

---

## G

**Gesture unlock** — The process of creating/resuming the `AudioContext` and priming the `<audio>` element during the first user interaction (click, keydown, touchend). Required by browsers to prevent autoplay. See `src/services/audio.ts`.

---

## H

**History** — The React component (`src/components/terminal/History.tsx`) that renders all past entries. Only the last entry can still be in the reveal animation; all others have `visibleUnits = Infinity`.

---

## I

**`idle` status** — The terminal's default state: waiting for the visitor to type. The prompt is visible and the input is enabled.

---

## J

**JSON block** — A block type that displays pretty-printed JSON with neutral-palette syntax coloring. Each line is a separate unit for the reveal animation. Built by `cat stack.json`.

---

## K

**KeyKind** — The classification of a keyboard key: `"generic"`, `"backspace"`, `"enter"`, or `"space"`. Used to select the appropriate audio bank in `keySound.ts`.

**Key sound** — The mechanical keyboard sound played when the visitor types in the Prompt. Powered by the Web Audio API. Only fires for physical key presses (not scripted typing or output reveals).

---

## L

**LazyMotion** — A `motion/react` wrapper that defers loading the animation features until they are needed, splitting them into a separate JS chunk.

**leave** — The page-fade transition before a redirect. Implemented via the `data-leaving` attribute on `<html>` and CSS in `index.css`. See `src/services/leave.ts`.

**List block** — A block type displaying rows of `(label, detail)` pairs. The label can be a clickable button that types and runs a command. Column width is stabilized by pre-computing the maximum label length.

**Lofi** — Lofi hip-hop background music played by the `play` command. Uses an `<audio>` element with fade-in/fade-out effects. See `src/services/lofi.ts`.

---

## M

**`measure`** — A Tailwind `@utility` that applies `max-width: 80ch`. Used on long prose blocks (project descriptions, experience summaries) to cap reading width.

**Memoisation** — The `Entry` component is wrapped in `React.memo`. This prevents finished entries from re-rendering when later entries are being revealed.

---

## N

**`normalize()`** — The first step in command processing. Trims, collapses spaces, lowercases, and replaces em/en dashes with `--`. See `src/engine/execute.ts:10-16`.

**null (from run())** — Returned by a command when it cannot handle the given argument combination at all (not a semantic error, but a complete non-match). Causes `execute()` to treat the input as an unknown command.

---

## O

**`ok()`** — A helper in `src/engine/commands/helpers.ts` that returns a valid `ExecResult` with the given blocks and optional actions (`[]` by default).

---

## P

**Phase** — In audio, either `"press"` (key down) or `"release"` (key up). Two separate banks of audio buffers are maintained. Release sounds are off by default (`config.keyboard.playRelease: false`).

**`pin()`** — A function returned by `useStickToBottom` that forces the scroll container back to the bottom and re-enables stick behavior. Called before every `submit()` or `runCommand()`.

**Priming** — The process of starting the lofi `<audio>` element (with a silent track) during the first user gesture, so that a later `playLofi()` call is allowed by the browser. See `primeLofi()` in `src/services/lofi.ts`.

**Prompt** — The active command input line. Shows the cursor, the typed text, and the prompt label (`rosh@portfolio ~ %`). Contains a hidden real `<input>` element and a visible `<div>` mirror.

---

## R

**Registry** — A `Map<string, Command>` in `src/engine/commands/index.ts`. Maps command names to their `Command` objects. `execute()` uses `registry.get(name)` to look up commands.

**Reduced motion** — Respects the `prefers-reduced-motion: reduce` CSS media query. In reduced motion mode, the reveal animation and the scripted typing are skipped (output appears instantly). The cursor blink animation is also disabled.

**Reveal** — The animation that shows each output unit (row, line, block) with a quick fade-in and 3px upward movement. Implemented in `src/components/blocks/Reveal.tsx` using `motion/react`.

**`revealed`** — A React state variable in `useTerminal` tracking how many units of the last entry are visible. Ranges from `0` (nothing shown) to `Infinity` (all shown). The `Entry` component uses this to slice its block content.

**`runCommand(text)`** — A `useTerminal` function that simulates a user typing `text` character-by-character and then submitting it. Used for the boot sequence and for clicking list items.

**Running status** — The terminal state while output is being revealed. The prompt is hidden and all input is locked. Any key press skips the animation.

---

## S

**Skip** — Finishing the current typing or reveal animation immediately. Triggered by any key press (except modifier keys alone) while the terminal is busy. Calls `skipRef.current()`.

**Slug** — A project's URL-friendly identifier. Lowercase, kebab-case. Used in commands: `cat <slug>.txt`, `run <slug>`.

**`status`** — See *Typing status*.

**StatusBar** — The slim header bar showing `rosh@portfolio` on the left and the sound toggle (and "now playing" track) on the right. See `src/components/layout/StatusBar.tsx`.

**Stick to bottom** — The scroll behavior where the terminal automatically scrolls to the bottom as new output appears, unless the visitor has scrolled up. See `src/hooks/useStickToBottom.ts`.

---

## T

**`targets` map** — In `ls.ts`, a `Map<string, () => Block[]>` mapping known directory names (`projects`, `games`, `books`) to builders.

**Tone** — The color variant for `text` blocks: `normal` (default), `muted` (secondary/hint), `strong` (headings). See `src/engine/types.ts:6`.

**Typing status** — One of three values for the terminal's current mode: `idle` (waiting for input), `typing` (a scripted command is being typed), `running` (output is being revealed).

---

## U

**Unit** — The smallest reveal step. A list block has one unit per row; a JSON block has one unit per line; all others have one unit total. Computed by `unitCount()` in `src/engine/blocks.ts`.

**`useAudio`** — A hook (`src/hooks/useAudio.ts`) that subscribes to `audioStore` via `useSyncExternalStore` and provides audio state to the `StatusBar`.

**`useKeySound`** — A hook (`src/hooks/useKeySound.ts`) that returns `{ keyDown, keyUp, inputChange }` handlers for the Prompt's input element. Routes key events to `playKey()`.

**`useStickToBottom`** — A hook (`src/hooks/useStickToBottom.ts`) that pins the scroll container to the bottom while content grows, unless the visitor has scrolled up.

**`useTerminal`** — The core hook (`src/hooks/useTerminal.ts`) owning all terminal state: entries, input, status, revealed count, timers, and the boot sequence.

**`useViewportHeight`** — A hook (`src/hooks/useViewportHeight.ts`) that tracks `visualViewport` to fix iOS keyboard-hiding-the-prompt issues.

---

## V

**Virtual keyboard** — An on-screen keyboard (Android, iOS). Android virtual keyboards report `key === "Unidentified"` for every keydown event. The key sound system detects this via `isVirtualKey()` and falls back to classifying sounds from input value changes.

**`visualViewport`** — A browser API providing the dimensions of the currently visible area of the page (excluding browser chrome and the on-screen keyboard). Used by `useViewportHeight`.

---

## W

**Web Audio API** — The browser's low-latency audio processing API. Used for key sounds because it has near-zero latency and supports overlapping sounds. The `AudioContext` object, `AudioBuffer` objects, and `BufferSourceNode`/`GainNode` graph are all part of this API.
