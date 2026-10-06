# Quiz 01 — The Big Picture

*Try closed-book first, then check answers and re-read the cited code.*

---

**Q1** [Recall] What does the command engine return when a command runs successfully?

A) A React element  
B) `{ blocks: Block[], actions: Action[] }`  
C) A string to display  
D) A Promise  

---

**Q2** [Design] Why are `Action` objects data rather than function calls?

A) Functions cannot be serialized to JSON  
B) So `window.open()` can be called synchronously within the user-gesture handler  
C) To allow the engine to run in a Web Worker  
D) So tests can compare them with `toEqual()`  

---

**Q3** [Apply] Trace the flow: which subsystem is called first after the visitor presses Enter?

A) `performAction()` in `actions.ts`  
B) `execute()` in `engine/execute.ts`  
C) `setEntries()` in React state  
D) `BlockRenderer` in the components  

---

**Q4** [Recall] The `audioStore` module is outside React. Which React API does `useAudio` use to subscribe to it?

A) `useContext`  
B) `useReducer`  
C) `useSyncExternalStore`  
D) `useRef`  

---

**Q5** [Design] What architectural rule would be violated if `cat.ts` imported from `src/hooks/useTerminal.ts`?

A) The engine must not import from hooks (engine purity rule)  
B) Circular imports are forbidden in TypeScript  
C) Commands must export named exports  
D) The engine cannot use async/await  

---

**Q6** [Trace] A user presses Enter after typing `clear`. In what order do these happen?

A) performAction → setEntries([]) → setStatus("idle")  
B) setEntries([]) → performAction → setStatus("idle")  
C) setStatus("idle") → performAction → setEntries([])  
D) execute() → action detected → setEntries([]) → early return (no performAction for clear)  

---

## Answers

---

**A1: B** (`src/engine/types.ts:49-52`)  
`ExecResult` always has `blocks` and `actions`. Never a React element or a Promise — the engine is pure synchronous TypeScript.

**A2: B** (`src/services/actions.ts:14` + Chapter 01 rationale)  
`window.open()` is only not blocked as a pop-up if called from a synchronous user-gesture handler. By returning the action as data, `performAction()` can be called in the same synchronous tick as the Enter key handler, before any `setState`.

**A3: B** (`src/hooks/useTerminal.ts:74`)  
The order is: `submit(raw)` → `execute(raw, { audio: getAudioState() })`. `execute()` is called before any state mutations or action dispatching.

**A4: C** (`src/hooks/useAudio.ts:7`)  
```ts
const { muted, playing } = useSyncExternalStore(subscribeAudio, getAudioState);
```
`useSyncExternalStore` is the correct React 18 API for subscribing to external mutable stores.

**A5: A**  
The golden rule: the engine imports only from `data/` and `lib/`. Importing from `hooks/` would couple the engine to React, making it impossible to test with plain imports. See Chapter 01 "Dependency Direction."

**A6: D** (`src/hooks/useTerminal.ts:76-88`)  
```ts
for (const action of result.actions) {
  if (action.type === "clear") cleared = true;
  else performAction(action);  // ← "clear" is NOT passed to performAction
}
if (cleared) { setEntries([]); setRevealed(Infinity); setStatus("idle"); return; }
```
`clear` is intercepted before `performAction`. `performAction` never sees it. The early `return` prevents any entry from being appended.
