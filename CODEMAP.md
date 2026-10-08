# CODEMAP

What each file does, and how a keypress becomes output. Short on purpose: open the file for the details.

## The flow in eight lines

1. A real `<input>` hidden over the prompt line captures typing (`components/terminal/Prompt.tsx`). What you see is drawn from state, with our own block cursor.
2. Every real key press goes through `hooks/useKeySound.ts`, the only place keyboard sounds start.
3. Enter calls `submit` in `hooks/useTerminal.ts`, which freezes the line into history.
4. `submit` calls `engine/execute.ts`: clean the text, find the command, run it. The engine returns **data**: output blocks and actions. It never touches the screen.
5. Actions (open a tab, download, redirect, play music, switch keyboard) run immediately via `services/actions.ts`, while the browser still counts it as a user click.
6. The blocks are revealed one line at a time (`Entry.tsx` + `blocks/*`). The prompt is hidden and input is locked until they finish. Any key skips ahead.
7. The prompt comes back, the input is focused, the view scrolls to the bottom (`hooks/useStickToBottom.ts`).
8. Clicking a command in the output types it into the prompt (silently) and submits it through the same path. The boot `rosh --help` works the same way.

## Folder rules

- `engine/` never imports React or anything in `components/`.
- `data/` is content only (plus its types). It imports nothing from the app.
- `components/` do not read `data/` or `services/` directly. They get what they need through the engine's output or a hook.
- `services/` are plain TypeScript, shared across the app, and live outside React.

## `src/engine/` (the brain, no React)

| File | What it does |
|---|---|
| `types.ts` | The vocabulary: `Block` (text, error, list, json, spacer, fastfetch), `Action`, `Command`, `ExecContext` |
| `execute.ts` | `normalize` (trim, lowercase, fix phone dashes) and `execute(raw, ctx)`; unknown input becomes the "command not found" error |
| `blocks.ts` | `unitCount`: how many reveal steps a block has (list rows, JSON lines, or 1) |
| `commands/index.ts` | The command list (its order is the help order) and the name/alias registry; a duplicate name throws |
| `commands/rosh.ts` | `rosh -h`, plus the aliases `help` and `?`. Help is built from each visible command's `usages` |
| `commands/ls.ts`, `cat.ts` | Directory and file tables; bare `ls` / `cat` list them. Project files come from `data/projects.ts` |
| `commands/run.ts` | `run <project>` (open tab action) and `run resume` (download action) |
| `commands/fastfetch.ts` | Builds the fastfetch block: logo, name, age (calculated), location, about |
| `commands/keyboard.ts` | `keyboard` and `keyboard <name>` |
| `commands/audio.ts` | `play` and `stop` |
| `commands/clear.ts`, `exit.ts` | Clear the screen; redirect to the main site after a short delay |
| `commands/extras.ts` | Hidden small commands: `whoami`, `hi`, `cd`, `pwd`, `fortune` |
| `commands/helpers.ts` | `ok(...)` and `fail(...)` result builders, and the standard hint line |

## `src/components/` (what is drawn)

| File | What it does |
|---|---|
| `terminal/Terminal.tsx` | The scroll area: history, then the live prompt; click-to-focus, tap-to-skip |
| `terminal/Prompt.tsx` | Hidden input plus the drawn prompt line and cursor; Enter, skip and key-sound wiring |
| `terminal/History.tsx`, `Entry.tsx` | Past commands; `Entry` reveals the latest one unit by unit and is memoised once finished |
| `terminal/CommandLine.tsx`, `PromptLabel.tsx`, `Cursor.tsx` | A frozen command line, the `rosh@portfolio:~$` label, the block cursor |
| `blocks/BlockRenderer.tsx` | One switch that picks the right component for each block type |
| `blocks/TextBlock`, `ErrorBlock`, `ListBlock`, `JsonBlock`, `SpacerBlock`, `FastfetchBlock` | One renderer per block type. `ListBlock` makes rows clickable (commands) or linked (URLs) |
| `blocks/Reveal.tsx` | The small fade-in for each revealed unit |
| `layout/StatusBar.tsx`, `Container.tsx` | The slim top bar with the sound toggle and now-playing text; the shared width (max-w-7xl) |
| `ErrorBoundary.tsx` | If anything crashes, a plain message with a link to the main site |

## `src/hooks/` (React glue)

| File | What it does |
|---|---|
| `useTerminal.ts` | The heart: history, input text, status (idle, typing, running), submit, scripted typing, skip, boot command |
| `useKeySound.ts` | Chooses which key sound to play for a real key press (including Android's text-change path) |
| `useAudio.ts` | Gives the status bar the shared audio state |
| `useStickToBottom.ts` | Keeps the view pinned to the bottom unless you scrolled up |
| `useViewportHeight.ts` | Sizes the app to the visible area so the iPhone keyboard does not cover the prompt |

## `src/services/` (shared, outside React)

| File | What it does |
|---|---|
| `actions.ts` | Performs the engine's actions: open, download, redirect (with fade), lofi, keyboard |
| `keySound.ts` | Web Audio key sounds: load packs, pick clips, throttle, switch packs, remember the choice |
| `lofi.ts` | The looping music `<audio>` element with fades, primed on first gesture for Safari |
| `audioStore.ts` | Tiny shared store: muted and playing, with subscribe for React |
| `audio.ts` | `initAudio`: start loading and unlock audio on the first click, tap or key press |
| `preferences.ts` | localStorage for mute and chosen keyboard pack (merges, never throws) |
| `leave.ts`, `navigate.ts` | The page fade-out used by `exit`, and same-tab navigation in one replaceable place |
| `preload.ts` | Preloads the fastfetch logo |

## `src/data/` (your content)

`config.ts` (main site URL, resume, logo, keyboard and lofi settings), `projects.ts`, `experience.ts`, `stack.ts`, `profile.ts`, `links.ts`, `games.ts`, `books.ts`, `gears.ts`, `fortunes.ts`, `types.ts`.
`keyboardPacks.ts` reads `keyboardPacks.generated.json`, which `scripts/keyboard-packs.mjs` rewrites from `public/audio/keys` before every dev, build and test run. Do not edit the JSON by hand.

## Other files

- `src/lib/`: `keys.ts` (which sound a key makes), `packs.ts` (find and choose a pack), `age.ts`, `utils.ts`, `motionFeatures.ts` (lazy-loaded animation code).
- `src/index.css`: the design tokens, the cursor styles, the exit fade.
- `src/App.tsx`, `main.tsx`: the app shell, and mounting with the error boundary.
- `public/`: logo, resume, favicon and share image, `audio/keys/<pack>/`, `audio/lofi/`.
- `scripts/keyboard-packs.mjs`: the pack scanner. `vercel.json`: headers and caching. `.env`: the two site URLs.
- `tests/`: 160+ tests. `commands`, `keyboard`, `extras` test the engine; `keySound` tests real sound logic against a fake Web Audio; `terminal`, `a11y`, motion and viewport tests render the UI.

## Recipes

**Add a command.** Create `engine/commands/<name>.ts` exporting a `Command` (name, `usages`, `run`). Return `ok(blocks, actions)` or `fail(message)`. Add it to the `rest` array in `commands/index.ts` (the position sets the help order). Add `hidden: true` to keep it out of help. Add tests.

**Add a project.** Add an object to `data/projects.ts`. The slug (lowercase, kebab-case) is what visitors type. Nothing else changes.

**Add a keyboard pack.** Copy the folder into `public/audio/keys/` and restart. It appears in `keyboard` by itself. Incomplete packs are skipped with a message in the terminal where you ran dev or build.

**Add a fortune.** Add a line to `data/fortunes.ts`.

**Add a new kind of output.** Add a block type to `engine/types.ts`, a component in `components/blocks/`, one `case` in `BlockRenderer.tsx`, and (if it is more than one reveal step) a case in `engine/blocks.ts`.

**Run it.** `bun install`, `bun run dev`. Checks: `bun run typecheck`, `bun run test`, `bun run build`.
