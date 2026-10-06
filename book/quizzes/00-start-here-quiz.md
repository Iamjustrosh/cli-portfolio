# Quiz 00 — Start Here

*Try closed-book first, then check answers and re-read the cited code.*

---

**Q1** [Recall] What is `rosh-terminal`?

A) A full Unix shell running in the browser  
B) A browser-based interactive terminal portfolio with a fixed set of commands  
C) A server-side terminal emulator  
D) A React Native mobile app  

---

**Q2** [Recall] Which command is run automatically when the page first loads?

A) `fastfetch`  
B) `ls projects`  
C) `rosh --help`  
D) `clear`  

---

**Q3** [Apply] A visitor types `cat my-app.txt`. For this to work, what must exist in `projects.ts`?

A) A project with `name: "my-app"`  
B) A project with `slug: "my-app"`  
C) A file called `my-app.txt` in `/public/`  
D) An entry in the `files` Map in `cat.ts`  

---

**Q4** [Design] Why does the engine (`src/engine/`) contain no React code?

A) React is too slow for command parsing  
B) So that commands can be unit-tested without rendering  
C) Because React was added after the engine was written  
D) To reduce bundle size  

---

**Q5** [Recall] Which files do you edit to add the owner's name, age, and location?

A) `src/data/config.ts`  
B) `src/data/profile.ts` and `src/data/config.ts`  
C) `src/data/profile.ts`  
D) `src/components/terminal/Prompt.tsx`  

---

## Answers

---

**A1: B**  
`src/main.tsx` and `index.html` make clear this is a browser SPA. The terminal runs a fixed set of typed commands — it is not a real shell and touches no real filesystem. (`src/engine/commands/index.ts` shows the complete, fixed command list.)

**A2: C** (`src/hooks/useTerminal.ts:23`)  
`const BOOT_COMMAND = "rosh --help"`. After a 450ms delay and font loading, this command is typed and submitted automatically.

**A3: B** (`src/engine/commands/cat.ts:18-31`)  
`cat.ts` looks up `slug` in the `projects` array using `projects.find((item) => item.slug === slug)` where the slug is derived from the filename by stripping `.txt`. The `name` field is display-only.

**A4: B**  
The engine's purity is the enabling constraint for the test suite. `tests/commands.test.ts` calls `execute("ls projects")` directly with no mocking, no rendering, no DOM. See Chapter 01 for the architectural discussion.

**A5: C** (`src/data/profile.ts`)  
`profile.name`, `profile.dateOfBirth`, `profile.location`, and `profile.summary` are all in `profile.ts`. `config.ts` holds technical settings (URLs, keyboard pack, lofi track). The `extras` field in `profile.ts` also allows additional rows between Location and About in `fastfetch`.
