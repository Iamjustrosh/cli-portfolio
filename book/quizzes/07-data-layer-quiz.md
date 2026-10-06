# Quiz 07 — Data Layer

*Try closed-book first, then check answers and re-read the cited code.*

---

**Q1** [Recall] Which file contains the list of all available commands and their descriptions?

A) `src/data/config.ts`  
B) `src/engine/commands/index.ts`  
C) It's derived dynamically from `usages` arrays in the command modules  
D) `src/data/commands.ts`  

---

**Q2** [Trace] In `projects.ts`, what rule must the `slug` field follow?

A) Must be an exact file name like `project.txt`  
B) Must be lowercase kebab-case and unique  
C) Can be anything, it's just an internal ID  
D) Must not contain numbers  

---

**Q3** [Apply] You want to change the URL that the `exit` command redirects to. Where do you change this?

A) `src/engine/commands/exit.ts`  
B) `src/data/config.ts`  
C) `.env` file (`VITE_MAIN_SITE_URL`)  
D) Both B and C are correct, but C is the preferred way via env vars  

---

**Q4** [Design] Why are all content structures defined as TypeScript types in `src/data/types.ts`?

A) Because Vite requires it  
B) To ensure the `cat` and `ls` commands can rely on specific fields existing  
C) Because JSON is not type-safe  
D) To make the bundle smaller  

---

## Answers

---

**A1: C** (`src/engine/commands/rosh.ts:24-26`)  
The help command iterates over all commands in the registry and extracts their `usages` array to build the help list.

**A2: B**  
`slug` is used for `cat <slug>.txt` and `run <slug>`. Since `execute()` lowercases and normalizes all input, the slug must be lowercase kebab-case to match. It must be unique so `Array.find` picks the right one.

**A3: D** (`src/data/config.ts:3`)  
```ts
mainSiteUrl: (import.meta.env.VITE_MAIN_SITE_URL as string | undefined) || "https://example.com"
```
It reads from the env var first, falling back to a string. Setting the env var is preferred.

**A4: B**  
The engine commands (`cat.ts`, `ls.ts`) expect objects with specific shapes (e.g., `item.slug`, `item.name`). TypeScript interfaces in `types.ts` enforce these shapes at compile time for the data files.
