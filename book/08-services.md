# Chapter 08 — Services & Side Effects

> **What you'll be able to answer after this chapter:**
> How are Actions dispatched to real browser behavior? How does the page-leave transition work (fade + redirect)? How is the resume downloaded? How is the logo preloaded?

---

## Overview

Services are non-React singletons that perform real browser side effects. The audio services are covered in [Chapter 06](06-audio-subsystem.md). This chapter covers the remaining services.

| File | Responsibility |
|------|---------------|
| `actions.ts` | Dispatches `Action` objects into real browser calls |
| `leave.ts` | Page fade-out and Back-button restoration |
| `navigate.ts` | Thin `window.location.href` wrapper |
| `preload.ts` | Logo preload at startup |
| `preferences.ts` | localStorage read/write (covered in Ch. 06) |

---

## actions.ts — The Side-Effect Dispatcher

```ts
// src/services/actions.ts
const FADE_MS = 550;  // page fade-out duration

export function performAction(action: Action): void {
  switch (action.type) {

    case "open":
      window.open(action.url, "_blank", "noopener,noreferrer");
      break;

    case "download": {
      const link = document.createElement("a");
      link.href = action.href;
      link.download = action.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      break;
    }

    case "redirect":
      if (!action.delayMs) {
        navigate(action.url);
        break;
      }
      // Start fade FADE_MS before the redirect fires
      if (!prefersReducedMotion()) {
        window.setTimeout(beginLeaving, Math.max(0, action.delayMs - FADE_MS));
      }
      window.setTimeout(() => navigate(action.url), action.delayMs);
      break;

    case "lofi":
      if (action.op === "play") playLofi();
      else stopLofi();
      break;

    case "clear":
      break;  // handled by useTerminal, ignored here
  }
}
```

**Why must this be synchronous?**

`window.open()` is only allowed from a synchronous user-gesture handler. If it were called after an `await` or `setTimeout`, browsers would block it as a pop-up. By returning `{ type: "open", url }` from the engine and calling `performAction()` synchronously in the Enter handler (before any `setState`), the open call happens while still within the user gesture.

**The `download` trick:** HTML5 download is triggered by creating a temporary `<a>` element with `download` attribute, programmatically clicking it, and removing it. This avoids `window.open()` and works for in-origin files (PDF in `/public/`).

**Redirect timing (delayMs = 900, FADE_MS = 550):**
- At t=0ms: `exit` typed, "redirecting…" shown.
- At t=350ms (= 900 - 550): `beginLeaving()` called → CSS fade starts.
- At t=900ms: `navigate(url)` called → page leaves.
- The fade finishes at 350 + 550 = 900ms, exactly when the redirect fires. The visitor sees a smooth fade-out.

**Reduced motion:** If `prefers-reduced-motion: reduce` is set, `beginLeaving()` is not called. The redirect still happens at 900ms, but without the CSS transition.

---

## leave.ts — Page Fade Transition

```ts
// src/services/leave.ts
const ATTRIBUTE = "leaving";

export function beginLeaving(): void {
  document.documentElement.dataset[ATTRIBUTE] = "true";
}

export function cancelLeaving(): void {
  delete document.documentElement.dataset[ATTRIBUTE];
}

export function watchPageShow(): () => void {
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) cancelLeaving();  // Back button: undo the fade
  };
  window.addEventListener("pageshow", onPageShow);
  return () => window.removeEventListener("pageshow", onPageShow);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
```

**How the fade works:** `beginLeaving()` sets `document.documentElement.dataset.leaving = "true"`, which adds `data-leaving` to `<html>`. The CSS in `index.css` reacts:

```css
/* src/index.css:62-72 */
#root { transition: opacity 0.5s ease-in; }
html[data-leaving] #root { opacity: 0; }
@media (prefers-reduced-motion: reduce) { #root { transition: none; } }
```

**`pageshow` / Back button:** When a visitor uses the browser Back button to return to the terminal, the page may be restored from the bfcache (browser back-forward cache) already faded out (because `data-leaving` was on `<html>` when they left). `watchPageShow()` listens for `pageshow` events with `event.persisted = true` and calls `cancelLeaving()` to undo the fade. This is why `watchPageShow()` is called in `App.useEffect`.

---

## navigate.ts — Location Wrapper

```ts
// src/services/navigate.ts (inferred — thin wrapper)
export function navigate(url: string): void {
  window.location.href = url;
}
```

This one-liner exists to make `navigate()` mockable in tests (a module import can be spied on; `window.location.href` cannot be easily mocked in jsdom). The `leave.test.ts` test suite uses this abstraction.

---

## preload.ts — Logo Preload

```ts
// src/services/preload.ts
export function preloadAssets(): void {
  const logo = new Image();
  logo.src = config.logo.src;
}
```

**Why preload the logo?** The `fastfetch` command shows a profile logo image. If the image is not preloaded, there would be a noticeable delay between typing `fastfetch` and seeing the image — the image would load *after* the block appears. Creating a throwaway `Image` object and setting its `src` triggers the browser to fetch and cache the image immediately at startup, so it's ready when needed.

**No callback needed:** The browser's cache handles the rest. When `FastfetchBlock` renders with the same `src`, the image is already in cache.

---

## App.tsx — Service Startup

```tsx
// src/App.tsx
export default function App() {
  useViewportHeight();

  useEffect(() => {
    preloadAssets();                   // preload logo
    const stopAudio = initAudio();     // prefetch key sounds + register gesture unlock
    const stopPageShow = watchPageShow(); // register Back-button handler
    return () => {
      stopAudio();
      stopPageShow();
    };
  }, []);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <div className="fixed inset-x-0 top-[var(--app-top,0px)] flex h-[var(--app-height,100dvh)] flex-col bg-neutral-900 text-neutral-200">
        <StatusBar />
        <Terminal />
      </div>
    </LazyMotion>
  );
}
```

**`useEffect([], [])` fires once after mount.** The `[]` dependency array ensures it runs only once. The cleanup functions (`stopAudio`, `stopPageShow`) are called on unmount (or in React Strict Mode's second effect run).

**`LazyMotion features={loadMotionFeatures} strict`:**
- `LazyMotion` loads the motion animation features lazily (as a separate JS chunk). Without it, the full motion library would be in the main bundle.
- `strict` mode: warns if you use a `motion.div` component that is not covered by the loaded features. Since `domAnimation` includes the features used (`Reveal.tsx` only uses `opacity` + `y` transform), no warnings fire.

---

**Where to look:**
- `src/services/actions.ts` — the performAction switch statement.
- `src/services/leave.ts` — the fade/restore logic.
- `src/index.css:62-72` — the CSS that reacts to `data-leaving`.
- `src/App.tsx:15-23` — service startup orchestration.
