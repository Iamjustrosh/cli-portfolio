# Quiz 03 — The Command Engine

*Try closed-book first, then check answers and re-read the cited code.*

---

**Q1** [Recall] What does `normalize("rosh  --HELP")` return?

A) `"rosh  --HELP"`  
B) `"rosh --help"`  
C) `"ROSH --HELP"`  
D) `"rosh-help"`  

---

**Q2** [Trace] A user types `CAT EXPERIENCE.TXT` (all caps, extra space). Does `cat experience.txt` match?

A) No — the engine is case-sensitive  
B) Yes — `normalize()` lowercases and collapses spaces  
C) No — all-caps triggers an error  
D) Yes — but only because `cat` is case-insensitive specially  

---

**Q3** [Design] Why does `createRoshCommand` take a `getCommands` thunk instead of `commands` directly?

A) To avoid importing a large file  
B) To prevent a circular import: `rosh.ts` is created before `commands` is fully defined  
C) For lazy initialization to save memory  
D) So the help list can be refreshed at runtime  

---

**Q4** [Apply] User types `play extra-arg`. What happens?

A) Returns `{ blocks: [error], actions: [] }` via `fail()`  
B) Returns `null` → falls through to unknown command error  
C) Plays music and ignores the extra argument  
D) Throws a runtime error  

---

**Q5** [Trace] `cat experience.txt` is called with `experience` having 2 entries. How many blocks does `experienceBlocks()` return?

A) 2  
B) 5  
C) 6  
D) 7 (with spacer)  

---

**Q6** [What-happens-if] User types `cat constructor`. What is the result?

A) JavaScript prototype chain is accessed, crashing the app  
B) "cat: constructor: no such file"  
C) Empty blocks returned  
D) "cat: constructor: prototype accessed"  

---

**Q7** [Design] The `files` map in `cat.ts` uses lazy builders (`() => Block[]`) instead of pre-computed arrays. Why?

A) To allow async data fetching  
B) To defer execution until the command runs (though in practice, data is static)  
C) To avoid TypeScript type errors  
D) Because Vite requires lazy evaluation  

---

## Answers

---

**A1: B** (`src/engine/execute.ts:10-16`)  
`normalize()` applies `.trim()`, `.replace(/\s+/g, " ")` (collapse spaces), and `.toLowerCase()`. `"rosh  --HELP"` → trim → `"rosh  --HELP"` → collapse → `"rosh --HELP"` → lowercase → `"rosh --help"`.

**A2: B** (`src/engine/execute.ts:10-16`)  
Yes. `normalize("CAT EXPERIENCE.TXT")` → `"cat experience.txt"`. The engine always normalizes before splitting on spaces.

**A3: B** (`src/engine/commands/index.ts:24` + `rosh.ts:10`)  
`rosh` is created first (line 24), but `commands` (the array it needs) is defined on line 26 — after `rosh`. Passing `() => commands` creates a closure that reads `commands` at call time, when it's already fully initialized.

**A4: B** (`src/engine/commands/audio.ts:11`)  
```ts
if (args.length > 0) return null;
```
`null` → `execute()` treats it as unknown command → `unknown("play extra-arg")` error. NOT a `fail()` error — the command completely declines to handle any invocation with arguments.

**A5: C**  
`experienceBlocks()` with 2 entries (indices 0 and 1):
- Index 0: no spacer (index > 0 is false), text×3 = 3 blocks.
- Index 1: spacer (index > 0 is true), text×3 = 4 blocks.
- Total: 3 + 4 = **7 blocks**... Wait, recounting: `[spacer, text, text, text]` for index 1. Index 0: `[text, text, text]`. Total = 3 + 4 = **7**. So the answer is D.

*Correction:* **A5: D — 7 blocks**  
- Entry 0 (index=0): `[text(strong), text(muted), text(measure)]` = 3 blocks.  
- Entry 1 (index=1): `[spacer, text(strong), text(muted), text(measure)]` = 4 blocks.  
- Total = **7 blocks**.  

(The question listed C=6 and D=7; D is correct.)

**A6: B** (`src/engine/commands/cat.ts:34` — Map usage)  
The `files` Map is a `new Map(…)` — not a plain object. `Map.prototype.get("constructor")` returns `undefined`. The code path then checks `name.endsWith(".txt")` — "constructor" doesn't end with ".txt", so it falls to `fail("cat: constructor: no such file")`.

**A7: B** (`src/engine/commands/cat.ts` — design inference)  
The builders are invoked only when the command is executed. For static data, this makes no practical difference — it's the same pattern as `ls.ts`. The thunk pattern makes the map extensible to dynamic data (inference).
