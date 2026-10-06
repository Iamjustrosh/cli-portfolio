# Quiz 04 — Terminal UI

*Try closed-book first, then check answers and re-read the cited code.*

---

**Q1** [Recall] What is `UNIT_DELAY` and what controls the reveal speed?

A) 70ms — delay before the first unit appears  
B) 34ms — delay between subsequent units  
C) 260ms — pause before submitting a typed command  
D) 450ms — boot delay  

---

**Q2** [Trace] A command produces 3 blocks: `[list(5 rows), text, text]`. `revealed = 6`. Which blocks are visible?

A) All of them  
B) The list (all 5 rows) + first text block  
C) The list (all 5 rows only)  
D) The list (5 rows) + first text + second text  

---

**Q3** [Design] Why is `statusRef` a `useRef` in addition to the `status` state?

A) To improve rendering performance  
B) To read the current status synchronously inside callbacks without stale closures  
C) Because React state is asynchronous  
D) For backwards compatibility with class components  

---

**Q4** [What-happens-if] A user types something in the Prompt while `status === "typing"`. What happens?

A) The input is accepted and added to the typed command  
B) The typing animation stops  
C) The key sound fires, `skip()` is called if not a modifier key, the animation finishes  
D) The key press is completely ignored  

---

**Q5** [Trace] The boot sequence waits for `document.fonts.ready`. What happens if this API throws?

A) The boot sequence aborts  
B) The catch block runs `/* go ahead */` and the sequence continues  
C) An error block is shown in the terminal  
D) The page reloads  

---

**Q6** [Design] `Entry` is wrapped in `React.memo`. What prevents past entries from re-rendering as later output appears?

A) React automatically batches state updates  
B) Past entries always receive `visibleUnits = Infinity`, which never changes  
C) Each entry has a unique `key` prop  
D) The `revealed` state is stored in a ref  

---

**Q7** [Locate] To add a 10-second boot delay instead of 450ms, which single constant do you change?

A) `FIRST_UNIT_DELAY`  
B) `TYPE_START_DELAY`  
C) `BOOT_DELAY`  
D) `PRE_SUBMIT_PAUSE`  

---

## Answers

---

**A1: B** (`src/hooks/useTerminal.ts:26`)  
```ts
const UNIT_DELAY = 34;
```
34ms between subsequent units (~29fps). The first unit has `FIRST_UNIT_DELAY = 70ms`.

**A2: B** (`src/components/terminal/Entry.tsx:26-34`)  
Block 0 (list, 5 units): `visible = min(5, 6-0) = 5`. `offset = 5`. ✓ Fully visible.  
Block 1 (text, 1 unit): `visible = min(1, 6-5) = 1`. `offset = 6`. ✓ Visible.  
Block 2 (text, 1 unit): `visible = min(1, 6-6) = 0`. Hidden.  
Total visible: list (5 rows) + first text.

**A3: B** (`src/hooks/useTerminal.ts:39,56-59`)  
Callbacks capture `statusRef.current` at call time, not the `status` value from the render that defined the callback. If `submit()` were in a `useCallback` with `status` in its closure, it would read stale state. `statusRef.current` is always up-to-date.

**A4: C** (`src/components/terminal/Prompt.tsx:43-51`)  
```ts
function handleKeyDown(event) {
  sound.keyDown(event);  // sound fires regardless
  if (!idle) {
    if (!isModifierKey(event.key)) { event.preventDefault(); onSkip(); }
    return;
  }
  // …
}
```
Key sound fires (always). If not a modifier key, `onSkip()` is called — the typing animation finishes instantly.

**A5: B** (`src/hooks/useTerminal.ts:182-186`)  
```ts
try { await document.fonts?.ready; } catch { /* fonts API unavailable: just go ahead */ }
```
The catch block is empty (comment only). Execution continues to the `setTimeout`.

**A6: B**  
`History.tsx` passes `visibleUnits={index === entries.length - 1 ? revealed : Infinity}`. All entries except the last always receive `Infinity`. Since `Infinity === Infinity`, `memo` sees no change and skips the re-render.

**A7: C** (`src/hooks/useTerminal.ts:24`)  
```ts
const BOOT_DELAY = 450;
```
Change to `10000` for a 10-second delay.
