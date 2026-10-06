# Quiz 02 — Core Concepts

*Try closed-book first, then check answers and re-read the cited code.*

---

**Q1** [Recall] How many units does a `list` block with 5 rows have?

A) 1  
B) 5  
C) 10  
D) Depends on the row content  

---

**Q2** [Recall] A `Command.run()` function returns `null`. What does `execute()` do?

A) Returns an empty ExecResult  
B) Returns the "unknown command" error  
C) Throws an error  
D) Retries with different args  

---

**Q3** [Apply] A usage has `run` set to `undefined`. How does it appear in `rosh -h`?

A) It is hidden from the list  
B) It appears as a clickable button  
C) It appears as non-clickable static text  
D) It causes a TypeScript error  

---

**Q4** [Design] Why does `ExecContext` exist rather than having the engine read from `audioStore` directly?

A) `audioStore` is not compatible with TypeScript  
B) So the engine stays pure — context is injected, not pulled from module state  
C) `audioStore` is asynchronous and the engine must be synchronous  
D) To support multiple audio stores in the future  

---

**Q5** [Trace] Given `status === "typing"`, the cursor state in `Prompt.tsx` is:

A) `"blink"`  
B) `"solid"`  
C) `"hollow"`  
D) `"hidden"`  

---

**Q6** [What-happens-if] What happens if two projects have the same slug?

A) TypeScript prevents it with a type error  
B) Both are shown by `ls projects`, but `cat` and `run` find the first one  
C) Only the second one works  
D) Both commands fail with an error  

---

## Answers

---

**A1: B** (`src/engine/blocks.ts:9-10`)  
```ts
case "list": return block.rows.length;
```
Each row is one unit. A 5-row list = 5 units.

**A2: B** (`src/engine/execute.ts:23-24`)  
```ts
const result = registry.get(name)?.run(args, ctx);
return result ?? unknown(raw);
```
`null` from `run()` falls through the `??` operator to `unknown(raw)`, which returns the "command not found" error. This is the same error as an unknown command name.

**A3: C** (`src/engine/commands/rosh.ts:24-26`)  
```ts
const rows = commands.flatMap((command) => command.usages)
  .map((usage) => ({ label: usage.label, command: usage.run, detail: usage.description }));
```
When `usage.run` is `undefined`, the row's `command` is `undefined`. In `ListBlock`, a row with no `command` renders a `<span>` instead of a `<button>`.

**A4: B** (`src/engine/types.ts:44-47`, Chapter 01 rationale)  
Engine purity means it reads no module-level state. At call time, `useTerminal` reads `getAudioState()` and passes the snapshot in. The engine is a pure function of its inputs.

**A5: B** (`src/components/terminal/Prompt.tsx:41`)  
```ts
const cursorState: CursorState = status === "typing" ? "solid" : focused ? "blink" : "hollow";
```
`"solid"` = a scripted command is being typed. This makes the cursor steady while the scripted typing animation runs.

**A6: B**  
`Array.find()` returns the first match. `ls projects` renders ALL slugs (maps the whole array), so both appear. `cat project.txt` and `run project` find only the first. No TypeScript error — slugs are not constrained by the type system.
