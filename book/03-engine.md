# Chapter 03 — The Command Engine

> **What you'll be able to answer after this chapter:**
> How does a raw string become blocks and actions? What is the registry and how does it work? How does each command parse arguments and produce output? What happens when a command is unknown, has wrong arguments, or has a bad target?

---

## Responsibility

The engine owns: **parsing input → dispatching to a command → returning structured output**.

The engine does **not** own: rendering, React state, audio, localStorage, routing, or any browser API.

---

## Files

| File | Purpose |
|------|---------|
| `src/engine/execute.ts` | `normalize()` + `execute()` — the entry point |
| `src/engine/blocks.ts` | `unitCount()` + `unitTotal()` — for reveal pacing |
| `src/engine/types.ts` | All engine types (Block, Action, Command, …) |
| `src/engine/commands/index.ts` | Registry (Map) + ordered command list |
| `src/engine/commands/helpers.ts` | `ok()` + `fail()` factories |
| `src/engine/commands/rosh.ts` | `rosh -h` (help generator) |
| `src/engine/commands/cat.ts` | `cat <file>` |
| `src/engine/commands/ls.ts` | `ls <directory>` |
| `src/engine/commands/run.ts` | `run <project>` / `run resume` |
| `src/engine/commands/fastfetch.ts` | `fastfetch` |
| `src/engine/commands/audio.ts` | `play` / `stop` |
| `src/engine/commands/clear.ts` | `clear` |
| `src/engine/commands/exit.ts` | `exit` |

---

## execute.ts — The Entry Point

### `normalize(raw: string): string`

```ts
// src/engine/execute.ts:10-16
export function normalize(raw: string): string {
  return raw
    .replace(/[\u2013\u2014]/g, "--")  // em/en dashes → "--" (mobile keyboard auto-correct fix)
    .trim()
    .replace(/\s+/g, " ")              // collapse multiple spaces
    .toLowerCase();
}
```

**Why the unicode replace:** Mobile keyboards (iOS, Android) auto-replace `--` with an em dash (`—`, U+2014). Without this, `rosh --help` typed on a phone would come in as `rosh —help` and not match any flag. This is a real-world mobile UX fix.

### `execute(raw: string, ctx: ExecContext): ExecResult`

```ts
// src/engine/execute.ts:18-25
export function execute(raw: string, ctx: ExecContext = DEFAULT_CONTEXT): ExecResult {
  const line = normalize(raw);
  if (!line) return { blocks: [], actions: [] };  // empty string → no-op

  const [name, ...args] = line.split(" ");         // first word = command name
  const result = registry.get(name)?.run(args, ctx); // look up and call
  return result ?? unknown(raw);                   // null or missing → error
}
```

**`result ?? unknown(raw)`:** If `registry.get(name)` returns `undefined` (unknown command) OR if the found command's `run()` returns `null` (invalid arguments), `unknown()` is called. Both cases produce the same user-visible error: `"command not found: ..."`.

**Note:** `unknown()` uses the original `raw` (not normalized) for display, but truncates at 60 chars to avoid flooding the screen with pasted garbage.

---

## commands/index.ts — The Registry

```ts
// src/engine/commands/index.ts
const rest: Command[] = [
  lsCommand, catCommand, runCommand, fastfetchCommand,
  playCommand, stopCommand, clearCommand, exitCommand,
];
const rosh: Command = createRoshCommand(() => commands);
export const commands: Command[] = [rosh, ...rest];
export const registry = new Map<string, Command>(
  commands.map((command) => [command.name, command])
);
```

**Order matters for help:** `rosh` appears first, so `rosh -h` shows `rosh -h` at the top. The array order defines the help list order.

**The lazy getter for `rosh`:** `createRoshCommand(() => commands)` passes a thunk that closes over `commands`. This is necessary because `rosh` needs the full command list (to generate help), but `commands` is defined after `rosh`. The thunk is called only when `rosh -h` runs, by which time `commands` is fully initialized. This avoids a circular import.

---

## commands/helpers.ts — ok() and fail()

```ts
// src/engine/commands/helpers.ts
export const HINT = "use rosh -h or rosh --help to view commands";

export function fail(message: string): ExecResult {
  return {
    blocks: [
      { type: "error", text: message },
      { type: "text", tone: "muted", text: HINT },
    ],
    actions: [],
  };
}

export function ok(blocks: ExecResult["blocks"], actions: ExecResult["actions"] = []): ExecResult {
  return { blocks, actions };
}
```

Every command uses these two factories. `fail()` consistently pairs an error block with a hint. `ok()` is just a convenience that sets `actions` to `[]` by default.

---

## Command Deep Dives

### `rosh` — Help Generator

```ts
// src/engine/commands/rosh.ts
const HELP_FLAGS = new Set(["-h", "--h", "--help"]);

export function createRoshCommand(getCommands: () => Command[]): Command {
  return {
    name: "rosh",
    usages: [{ label: "rosh -h", description: "show this list", run: "rosh -h" }],
    run(args) {
      const wantsHelp = args.length === 0 || (args.length === 1 && HELP_FLAGS.has(args[0]));
      return wantsHelp ? help(getCommands()) : null;
    },
  };
}

function help(commands: Command[]): ExecResult {
  const rows: ListRow[] = commands
    .flatMap((command) => command.usages)
    .map((usage) => ({ label: usage.label, command: usage.run, detail: usage.description }));

  return { blocks: [{ type: "text", tone: "muted", text: "type a command, or click one:" }, { type: "list", rows }], actions: [] };
}
```

**Self-documentation contract:** Help is generated from each command's own `usages` array. If a usage has `run` set, it becomes a clickable button in the list. If `run` is absent (e.g., `"cat <project>.txt"`), it is non-clickable static text. This means help can *never* drift from actual command behavior — the same `usages` that document the command also drive the help list.

**`rosh` with no args or unknown args:** `rosh` (no args) shows help. `rosh foo` returns `null` (not a help flag) → falls through to "unknown command". This is intentional: `rosh` is not a catch-all, only `-h/--help` variants.

---

### `ls` — Directory Lister

```ts
// src/engine/commands/ls.ts
const targets = new Map<string, () => Block[]>([
  ["projects", () => [{ type: "list", rows: projects.map(p => ({ label: p.slug, command: `cat ${p.slug}.txt`, detail: p.tagline })) }]],
  ["games",    () => [{ type: "list", rows: games.map(g => ({ label: g.title, detail: g.note })) }]],
  ["books",    () => [{ type: "list", rows: books.map(b => ({ label: b.title, detail: b.note })) }]],
]);

run(args) {
  if (args.length === 0) return fail("ls: missing directory");
  if (args.length > 1)  return fail("ls: too many arguments");
  const build = targets.get(args[0]);
  return build ? ok(build()) : fail(`ls: ${args[0]}: no such directory`);
}
```

**`targets` is a Map of lazy builders:** Each value is a `() => Block[]` function, not a precomputed array. This means the block data is built fresh each time `ls projects` runs. In practice this doesn't matter (data is static), but it means the Map can be extended with dynamic directories.

**Map.get() safety:** `Map.prototype.get()` returns `undefined` for missing keys, not throwing. The `?:` ternary handles this.

**`"ls constructor"` test case:** Because this is a `Map`, not a plain object, `targets.get("constructor")` returns `undefined` correctly. Plain object lookups (`obj["constructor"]`) would return `Object.prototype.constructor`, which was historically a security concern. The test in `commands.test.ts:34` specifically validates this.

---

### `cat` — File Reader

```ts
// src/engine/commands/cat.ts
const files = new Map<string, () => Block[]>([
  ["experience.txt", experienceBlocks],
  ["stack.json",     () => [{ type: "json", lines: JSON.stringify(stack, null, 2).split("\n") }]],
  ["connect.txt",    () => [{ type: "list", rows: links.map(…) }]],
  ["gears.txt",      () => [{ type: "list", rows: gears.map(…) }]],
]);

run(args) {
  if (args.length === 0) return fail("cat: missing file name");
  if (args.length > 1)  return fail("cat: too many arguments");
  const name = args[0];

  const build = files.get(name);
  if (build) return ok(build());

  if (name.endsWith(".txt")) {
    const blocks = projectBlocks(name.slice(0, -".txt".length));  // strip ".txt" to get slug
    if (blocks) return ok(blocks);
  }
  return fail(`cat: ${name}: no such file`);
}
```

**Two-tier lookup:**
1. First check the static `files` map (known filenames).
2. If not found and it ends in `.txt`, treat it as a project slug (`cat project-one.txt` → slug `project-one`).
3. If neither matches: `fail()`.

**`projectBlocks(slug)` inner function:**

```ts
function projectBlocks(slug: string): Block[] | null {
  const project = projects.find((item) => item.slug === slug);
  if (!project) return null;
  return [
    { type: "text", tone: "strong", text: project.name },
    { type: "text", tone: "muted", text: project.tagline },
    { type: "spacer" },
    { type: "text", measure: true, text: project.description },
    { type: "spacer" },
    { type: "list", rows: [{ label: `run ${project.slug}`, command: `run ${project.slug}`, detail: project.url }] },
  ];
}
```

The last block is always a clickable `run <slug>` row so visitors can immediately open the project from the description view.

**`experienceBlocks()` inner function:**

```ts
function experienceBlocks(): Block[] {
  return experience.flatMap((entry, index): Block[] => [
    ...(index > 0 ? [{ type: "spacer" } as const] : []),  // spacer between entries, not before first
    { type: "text", tone: "strong", text: `${entry.role}, ${entry.company}` },
    { type: "text", tone: "muted", text: entry.period },
    { type: "text", measure: true, text: entry.summary },
  ]);
}
```

The conditional spacer (`index > 0`) ensures no leading spacer before the first entry — a common display pattern.

---

### `run` — Project Opener & Resume Downloader

```ts
// src/engine/commands/run.ts
run(args) {
  if (args.length === 0) return fail("run: missing target");
  if (args.length > 1)  return fail("run: too many arguments");
  const target = args[0];

  if (target === "resume") {
    return ok(
      [{ type: "text", tone: "muted", text: `downloading ${config.resume.filename}...` }],
      [{ type: "download", href: config.resume.href, filename: config.resume.filename }]
    );
  }

  const project = projects.find((item) => item.slug === target);
  if (!project) return fail(`run: ${target}: not found`);
  return ok(
    [{ type: "text", tone: "muted", text: `opening ${project.name} in a new tab...` }],
    [{ type: "open", url: project.url }]
  );
}
```

**The `resume` special case is first.** If a project happened to have `slug: "resume"`, it would never be reachable (resume check wins). This is intentional — resume is a first-class feature.

**Actions are data:** The engine returns `{ type: "open", url }` and `{ type: "download", href, filename }` as plain objects. The terminal calls `performAction()` synchronously in the Enter handler. This is what makes `window.open()` work without a pop-up blocker.

---

### `fastfetch` — Profile Card

```ts
// src/engine/commands/fastfetch.ts
run(args) {
  if (args.length > 0) return null;  // any args → null (not "wrong args", just "I don't handle this")
  return ok([{
    type: "fastfetch",
    logo: config.logo,
    heading: profile.name,
    subheading: "rosh@portfolio",
    rows: [
      { label: "Age", value: `${ageFromBirthDate(profile.dateOfBirth)} years` },
      { label: "Location", value: profile.location },
      ...profile.extras,
      { label: "About", value: profile.summary },
    ],
  }]);
}
```

**Age is computed at run time:** `ageFromBirthDate(profile.dateOfBirth)` calculates the current age from a `"YYYY-MM-DD"` string. The birthday check is: `hadBirthdayThisYear = month > birthMonth || (month === birthMonth && day >= birthDay)`. This means the terminal always shows the correct age without redeployment.

---

### `audio` — play / stop

```ts
// src/engine/commands/audio.ts
export const playCommand: Command = {
  name: "play",
  run(args, ctx) {
    if (args.length > 0) return null;
    if (ctx.audio.playing) {
      return ok([{ type: "text", text: `already playing: ${label()}` }]);
    }
    const blocks: Block[] = [];
    if (ctx.audio.muted) {
      blocks.push({ type: "text", tone: "muted", text: "sound was off, turning it on" });
    }
    blocks.push({ type: "text", text: `now playing: ${label()}` });
    const { url } = config.lofi;
    if (url) blocks.push({ type: "list", rows: [{ label: "source", detail: url, href: url }] });
    return ok(blocks, [{ type: "lofi", op: "play" }]);
  },
};
```

**`ctx.audio` is the snapshot:** The terminal reads `getAudioState()` and passes it in. The command reads `ctx.audio.playing` to know if music is already running. It doesn't reach into `audioStore` directly.

**`stop` defers to `ctx.audio.playing`:** If nothing is playing, it returns a text block and no action. If playing, it returns the `lofi stop` action. The lofi service handles the actual fade-out.

---

### `clear` and `exit`

```ts
// clear: just returns the action
run(args) {
  if (args.length > 0) return null;
  return { blocks: [], actions: [{ type: "clear" }] };
}

// exit: shows a message then redirects after 900ms
run(args) {
  if (args.length > 0) return null;
  return ok(
    [{ type: "text", tone: "muted", text: `redirecting to ${config.mainSiteUrl}...` }],
    [{ type: "redirect", url: config.mainSiteUrl, delayMs: 900 }]
  );
}
```

**`clear` returns no blocks:** The terminal renders a command echo line and then nothing. The `clear` action causes `useTerminal` to reset `entries = []` before rendering, so nothing from before is visible.

**`exit` delay:** 900ms gives the visitor time to read "redirecting to…" before the page leaves. Meanwhile, `actions.ts` starts the CSS fade-out at `900 - 550 = 350ms` so the fade finishes just as the redirect fires.

---

## Traced Example: `ls projects`

Input: `"ls projects"` (user presses Enter)

1. `normalize("ls projects")` → `"ls projects"` (already clean).
2. `split(" ")` → `name="ls"`, `args=["projects"]`.
3. `registry.get("ls")` → `lsCommand`.
4. `lsCommand.run(["projects"], ctx)`.
5. `args.length === 1` ✓, `args[0] === "projects"` → `targets.get("projects")` returns the builder.
6. Builder runs: `projects.map(p => ({ label: p.slug, command: "cat project-one.txt", detail: p.tagline }))`.
7. Returns `ok([{ type: "list", rows: [...3 rows...] }])`.
8. `execute` returns `{ blocks: [listBlock], actions: [] }`.
9. `useTerminal.submit()` gets this result, counts `unitTotal([listBlock]) = 3` (3 rows).
10. Appends entry, sets `revealed = 0`, `status = "running"`.
11. Timer fires 3 times at 70ms, 104ms, 138ms, incrementing `revealed` each time.
12. `Entry` → `BlockRenderer` → `ListBlock` renders `rows.slice(0, revealed)` each tick.
13. After 3rd tick: `status = "idle"`, `revealed = Infinity`.

---

**→ Check your understanding:** [quizzes/03-engine-quiz.md](quizzes/03-engine-quiz.md)
