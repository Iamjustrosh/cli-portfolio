# Chapter 13 — How Do I…? (Cookbook)

> Common change recipes grounded in real files. Each recipe tells you what to edit, why, and what to watch out for.

---

## Portfolio Content Changes

### Add a new project

**File:** `src/data/projects.ts`

```ts
export const projects: Project[] = [
  // ... existing projects
  {
    slug: "my-new-project",          // MUST be lowercase kebab-case, unique, not "resume"
    name: "My New Project",
    tagline: "one line shown in ls projects",
    description: "Two paragraphs shown by cat my-new-project.txt.\nUse \\n for line breaks.",
    url: "https://my-new-project.com",
  },
];
```

**What you get for free:** `ls projects` lists it, `cat my-new-project.txt` shows it, `run my-new-project` opens it. No other files to change.

---

### Add a new command

**Step 1:** Create `src/engine/commands/mycommand.ts`:

```ts
import type { Command } from "../types";
import { fail, ok } from "./helpers";

export const myCommand: Command = {
  name: "mycommand",
  usages: [
    { label: "mycommand", description: "does something cool", run: "mycommand" },
    { label: "mycommand <thing>", description: "does it with a thing" },
  ],
  run(args, ctx) {
    if (args.length === 0) return fail("mycommand: missing argument");
    // ... your logic
    return ok([{ type: "text", text: "done!" }]);
  },
};
```

**Step 2:** Register it in `src/engine/commands/index.ts`:

```ts
import { myCommand } from "./mycommand";

const rest: Command[] = [
  lsCommand, catCommand, runCommand, fastfetchCommand,
  playCommand, stopCommand, clearCommand, exitCommand,
  myCommand,  // ← add here
];
```

**What you get for free:** `rosh -h` shows the new command automatically. No other changes needed.

---

### Change the keyboard sound pack

**File:** `src/data/config.ts`

```ts
keyboard: {
  pack: "mxblue",  // change this
  // Available: alpaca, blackink, bluealps, boxnavy, cream, holypanda, mxblack, mxblue, mxbrown, redink, topre, turquoise
}
```

**Prerequisite:** The audio files must exist in `/public/audio/keys/<pack>/press/` (and `/release/` if `playRelease: true`). If files are missing, sounds are silently skipped.

---

### Change the lofi track

**File:** `src/data/config.ts`

```ts
lofi: {
  src: "/audio/lofi/mytrack.mp3",
  title: "My Track",
  artist: "Artist Name",
  url: "https://soundcloud.com/artist/mytrack",  // optional
  volume: 0.35,  // much quieter than key sounds
}
```

Put the MP3 in `/public/audio/lofi/mytrack.mp3`. The track is streamed (not base64-embedded), so file size is not a concern for initial load.

---

### Change the `exit` destination

**File:** `.env` (copy from `.env.example`)

```
VITE_MAIN_SITE_URL=https://your-main-site.com
```

Or, if deploying to Vercel, add `VITE_MAIN_SITE_URL` as an environment variable in the Vercel dashboard.

---

### Add a new `ls` directory

**File:** `src/engine/commands/ls.ts`

Add a new entry to the `targets` map:

```ts
const targets = new Map<string, () => Block[]>([
  ["projects", () => [ /* … */ ]],
  ["games",    () => [ /* … */ ]],
  ["books",    () => [ /* … */ ]],
  ["tools",    () => [{
    type: "list",
    rows: myTools.map((tool) => ({ label: tool.name, detail: tool.description })),
  }]],  // ← add here
]);
```

Also add to the `usages` array:

```ts
usages: [
  { label: "ls projects", description: "list my projects", run: "ls projects" },
  { label: "ls games",    description: "games I like to play", run: "ls games" },
  { label: "ls books",    description: "books I have read", run: "ls books" },
  { label: "ls tools",    description: "tools I use", run: "ls tools" },  // ← add
],
```

---

### Add a new `cat` file

**File:** `src/engine/commands/cat.ts`

```ts
const files = new Map<string, () => Block[]>([
  // ... existing entries
  ["awards.txt", () => [{
    type: "list",
    rows: myAwards.map((award) => ({ label: award.title, detail: award.year.toString() })),
  }]],
]);
```

Also add to `usages`:

```ts
usages: [
  // ... existing
  { label: "cat awards.txt", description: "awards I have received", run: "cat awards.txt" },
],
```

---

### Add a new block type

This is the most involved change.

**Step 1:** Add the new type to `src/engine/types.ts`:

```ts
export type Block =
  | { type: "text"; … }
  | // ... existing types
  | { type: "table"; headers: string[]; rows: string[][] };
```

**Step 2:** Add a unit count in `src/engine/blocks.ts`:

```ts
export function unitCount(block: Block): number {
  switch (block.type) {
    case "list":  return block.rows.length;
    case "json":  return block.lines.length;
    case "table": return block.rows.length;  // ← add
    default:      return 1;
  }
}
```

**Step 3:** Create `src/components/blocks/TableBlock.tsx`.

**Step 4:** Add the case in `src/components/blocks/BlockRenderer.tsx`:

```ts
case "table": return <TableBlock headers={block.headers} rows={block.rows} visible={visible} animate={animate} />;
```

**TypeScript:** The `switch` in `BlockRenderer` is exhaustive. TypeScript will report an error if you add a block type to `types.ts` but don't add a case in `BlockRenderer`. This is enforced by `tsconfig.json`'s `strict` mode.

---

## Development Workflow

### Run the dev server

```bash
bun run dev   # → http://localhost:5173 with HMR
```

### Type-check without running tests

```bash
bun run typecheck
```

### Run tests

```bash
bun run test              # run once
bun run test -- --watch   # watch mode
```

### Build for production

```bash
bun run build   # runs: tsc --noEmit && vite build
```

Output goes to `dist/`. The `tsc --noEmit` step runs before Vite, so the build fails on type errors.

---

## Deployment (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set environment variables:
   - `VITE_MAIN_SITE_URL` = your main site URL
   - `VITE_SITE_URL` = this terminal's URL (for OG tags)
4. Deploy.

**`vercel.json`** sets:
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing.
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer data.
- `Cache-Control: public, max-age=31536000, immutable` on `/assets/**` — Vite's content-hashed chunks are cached forever.
- `Cache-Control: public, max-age=604800` on `/audio/**` — audio files cached for 1 week.

---

## Debugging

### "I added a project but cat doesn't work"

Check that the `slug` is lowercase kebab-case and that you typed it exactly: `cat my-project.txt` must match `slug: "my-project"`.

### "The sound isn't playing"

1. Check browser console for fetch errors (wrong pack name or missing files).
2. Check if `audioStore.muted === true` (toggle sound in the status bar).
3. Check if `AudioContext` is in a bad state (open DevTools > Application > Audio context).

### "The boot sequence runs twice in development"

Expected behavior in React Strict Mode. `useEffect` runs twice intentionally. The `cancelled` flag in the boot effect prevents the `runCommand` from firing on the first (cancelled) run.

### "Tests fail after adding a project"

The test suite imports from `src/data/projects.ts` directly. Any data change affects tests. Check `tests/commands.test.ts` — some tests validate specific content.
