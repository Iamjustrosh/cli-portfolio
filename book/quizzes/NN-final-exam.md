# Final Exam

*Try closed-book first, then check answers.*

---

**Q1** Describe the end-to-end data flow when a user clicks a button that runs `run project-one`. Include:
- The React component that intercepts the click.
- The hook method called.
- The typing simulation.
- How the side-effect (opening the URL) is executed without being blocked by a pop-up blocker.

---

**Q2** The `engine` is strictly pure and has no access to React state, `localStorage`, or the DOM. Yet, the `play` command behaves differently based on whether music is already playing. How is this possible?

---

**Q3** What happens if `cat.ts` throws an uncaught JavaScript error? How does the user see the failure?

---

**Q4** Explain the dual-layer architecture of the `<Prompt />` component. Why not just use a standard styled `<input>`?

---

**Q5** What is the exact sequence of events during the boot sequence (`rosh --help`)? Include timings (in ms) and explain how a user can preempt it.

---

## Answers

---

**A1:** 
1. `ListBlock` renders the button. Clicking it calls `onRun("run project-one")`.
2. `Terminal.tsx` receives `onRun`, calls `pin()` (scroll to bottom), and delegates to `useTerminal.runCommand()`.
3. `runCommand` sets status to `"typing"`, then uses `setTimeout` to append characters one by one with a random delay (28-62ms).
4. After a pause (260ms), `submit("run project-one")` is called.
5. `execute` returns an `Action` of type `"open"`.
6. In `submit`, a loop calls `performAction(action)` *synchronously* before any `setState` calls, keeping it within the original click/Enter event tick. Thus, `window.open` is allowed by the browser.

**A2:** 
The terminal injects an `ExecContext` snapshot at call time: `execute(raw, { audio: getAudioState() })`. The command reads `ctx.audio.playing` to determine its behavior, keeping the engine pure.

**A3:**
The error propagates up the React tree and is caught by `ErrorBoundary.tsx` in `main.tsx`. The entire app is replaced by a static error UI containing a link to `config.mainSiteUrl`.

**A4:**
A standard `<input>` cannot style an inline block cursor (like terminal cursors) mixed with text. The dual layer uses an invisible `<input>` positioned over the exact area for typing/screen-readers, while a visible `<div aria-hidden="true">` mirrors the content and manually places the `<Cursor />` component exactly where the hidden input's caret is.

**A5:**
1. Wait for `document.fonts.ready`.
2. Wait `BOOT_DELAY` (450ms).
3. If the user hasn't typed anything (`entryCount === 0` and `input === ""`), call `runCommand("rosh --help")`.
4. The characters are typed at random intervals.
5. Pause for `PRE_SUBMIT_PAUSE` (260ms), then submit.
6. The user can preempt it by simply typing or clicking in the terminal during the initial 450ms wait.
