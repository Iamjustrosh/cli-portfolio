# Chapter 10 — Cross-Cutting Concerns

> **What you'll be able to answer after this chapter:**
> How is the design system structured? How does the cursor work? How does the iOS keyboard height problem get solved? How is accessibility handled? What does the error boundary do?

---

## Design System (index.css)

The entire CSS lives in `src/index.css`. It uses Tailwind CSS v4's `@theme` API.

### Fonts

```css
/* src/index.css:1-5 */
@import "tailwindcss";
@import "@fontsource-variable/geist-mono";   /* variable-weight monospace */
@import "@fontsource-variable/inter";         /* variable-weight sans */
@import "@fontsource/geist-pixel";            /* pixel art for fastfetch heading */

@theme {
  --font-mono:  "Geist Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --font-sans:  "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-pixel: "Geist Pixel", "Geist Mono Variable", ui-monospace, monospace;
}
```

**Why Geist Mono?** Variable weight and clean, slightly humanized letterforms. Ligatures are disabled (`font-feature-settings: "calt" 0`) to keep the terminal "honest" — no `=>` becoming `⇒`.

**`font-pixel` fallback chain:** Falls back to Geist Mono if Geist Pixel is unavailable. The heading will still render correctly (just not pixelated).

### Color Tokens

```css
@theme {
  --color-accent: var(--color-green-400);   /* #4ade80 */
  --color-danger: var(--color-red-400);     /* #f87171 */
}
```

Only two accent colors, intentionally minimal. The entire UI uses `neutral-*` shades (`neutral-50` through `neutral-900`) plus:
- `accent`: cursor, hover states, clickable labels, focus outline.
- `danger`: error block text.

**Selection highlight:**
```css
::selection {
  background-color: color-mix(in oklab, var(--color-accent) 30%, transparent);
  color: var(--color-neutral-50);
}
```
30% green mixed with transparent gives a subtle green selection highlight.

### The `measure` Utility

```css
/* src/index.css:23-25 */
@utility measure {
  max-width: 80ch;
}
```

Applied to long text blocks (project descriptions, experience summaries, biography) to cap reading width at 80 characters. Not applied to list or table data which should use full width.

---

## Block Cursor (terminal-cursor)

```css
/* src/index.css:91-126 */
.terminal-cursor {
  color: var(--color-neutral-900);
  background-color: var(--color-accent);
}

.terminal-cursor[data-state="blink"] {
  animation: cursor-blink 1.05s steps(1, end) infinite;
}

.terminal-cursor[data-state="hollow"] {
  color: inherit;
  background-color: transparent;
  outline: 1px solid var(--color-accent);
  outline-offset: -1px;
}

@keyframes cursor-blink {
  0%, 50%   { color: var(--color-neutral-900); background-color: var(--color-accent); }
  50.01%, 100% { color: var(--color-neutral-50); background-color: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .terminal-cursor[data-state="blink"] { animation: none; }
}
```

**Three cursor states:**
1. `solid` (state during scripted typing): steady block, no animation.
2. `blink` (focused + idle): `steps(1, end)` gives a hard on/off blink rather than a smooth fade. This matches real terminal behavior.
3. `hollow` (page not focused): just an outline around the character, no fill.

**`steps(1, end)`:** Divides the 1.05s animation into 1 step with no easing. The cursor is fully on for the first 50% of the cycle, fully off for the second 50%. This creates the sharp blink you see in real terminals.

**`Cursor` component:**
```tsx
// src/components/terminal/Cursor.tsx
export default function Cursor({ char, state }) {
  return (
    <span aria-hidden="true" data-state={state} className="terminal-cursor">
      {char === " " ? "\u00a0" : char}
    </span>
  );
}
```

`aria-hidden="true"` — the cursor is decorative. Screen readers use the real `<input>`.

`char === " " ? "\u00a0" : char` — a regular space would collapse in HTML. `\u00a0` (non-breaking space) preserves the cursor block width.

---

## Viewport Height Fix (useViewportHeight)

```ts
// src/hooks/useViewportHeight.ts
export function useViewportHeight(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;

    const apply = () => {
      if (Math.abs(viewport.scale - 1) > 0.01) {
        // Pinch-zoomed: remove overrides so the browser handles layout
        root.style.removeProperty("--app-height");
        root.style.removeProperty("--app-top");
        return;
      }
      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.style.setProperty("--app-top", `${viewport.offsetTop}px`);
    };

    apply();
    viewport.addEventListener("resize", apply);
    viewport.addEventListener("scroll", apply);
    return () => { /* remove listeners, clear properties */ };
  }, []);
}
```

**The iOS problem:** On iOS Safari, when the on-screen keyboard opens, the layout viewport does NOT shrink (unlike Chrome on Android). Only the visual viewport shrinks. This means without a fix, the terminal prompt would be hidden behind the keyboard.

**The fix:** Listen to `visualViewport.resize` and `visualViewport.scroll` events, which fire when the keyboard opens/closes or the page scrolls. Set CSS custom properties `--app-height` and `--app-top` on `<html>`. The app shell uses them:

```tsx
// src/App.tsx
<div className="fixed inset-x-0 top-[var(--app-top,0px)] flex h-[var(--app-height,100dvh)] flex-col …">
```

The fallbacks (`0px` and `100dvh`) apply when `visualViewport` is not available (old browsers).

**`viewport.offsetTop`:** When the keyboard opens, `offsetTop` is the vertical offset of the visible area. Setting `top` to this value ensures the app stays within the visible area.

**Pinch-zoom exclusion:** When the page is pinch-zoomed (`scale > 1.01`), the CSS overrides are removed. Trying to track the visual viewport during zoom is complex and not necessary for the terminal UX.

---

## Accessibility

The terminal implements several important a11y patterns:

### Hidden input + visual mirror

```tsx
// src/components/terminal/Prompt.tsx
{/* Visual mirror — hidden from screen readers */}
<div aria-hidden="true" …>
  <PromptLabel />
  <span>{before}</span>
  <Cursor char={char} state={cursorState} />
  <span>{after}</span>
</div>

{/* Real input — what screen readers interact with */}
<input
  aria-label="Terminal command input"
  autoFocus
  autoCapitalize="off"
  autoComplete="off"
  autoCorrect="off"
  spellCheck={false}
  enterKeyHint="send"
  className="absolute inset-0 … opacity-0"
/>
```

Screen readers see a text input labeled "Terminal command input". The visual block cursor and prompt label are `aria-hidden`. This avoids a double-announcement problem where both the visual and the input try to narrate keypresses.

### Live region

```tsx
// src/components/terminal/Terminal.tsx
<div ref={contentRef} role="log" aria-live="polite" …>
```

`role="log"` + `aria-live="polite"` marks the output area as a log. Screen readers announce new content as it appears, after finishing whatever they were saying (polite = non-interrupting).

### Cursor is hidden from screen readers

```tsx
// Cursor.tsx
<span aria-hidden="true" data-state={state} className="terminal-cursor">
```

The cursor character would otherwise be read as a word by screen readers.

### Focus management

```ts
// src/components/terminal/Terminal.tsx
useEffect(() => {
  if (status === "idle") inputRef.current?.focus({ preventScroll: true });
}, [status]);
```

When the terminal returns to `idle`, focus is automatically moved back to the input. This ensures keyboard users don't lose focus after a command runs.

### Touch target size

Clickable items in `ListBlock` use `min-h-6` (24px). WCAG 2.5.5 recommends at least 44×44px for touch targets; 24px falls below this, but the list layout naturally provides adequate width. This is a minor accessibility gap in the current implementation.

---

## Container.tsx — Layout Consistency

```tsx
// src/components/layout/Container.tsx
export default function Container({ children, className = "" }) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
```

Used by both `StatusBar` and `Terminal`. Ensures the left/right text edges always line up between the status bar and the terminal content. Without this, the status bar text might be at a different indent than the terminal prompt.

---

## StatusBar.tsx

```tsx
// src/components/layout/StatusBar.tsx
export default function StatusBar() {
  const { muted, playing, trackLabel, toggleMuted } = useAudio();

  return (
    <header className="shrink-0 border-b border-neutral-800 bg-neutral-900 pt-[env(safe-area-inset-top)]">
      <Container className="flex h-9 items-center justify-between gap-4 text-xs text-neutral-400">
        <span className="shrink-0">rosh@portfolio</span>
        <div className="flex min-w-0 items-center gap-4">
          {playing ? <span className="truncate">now playing: {trackLabel}</span> : null}
          <button type="button" onClick={toggleMuted} aria-pressed={!muted} aria-label="Toggle sound">
            [sound: {muted ? "off" : "on"}]
          </button>
        </div>
      </Container>
    </header>
  );
}
```

**`pt-[env(safe-area-inset-top)]`:** On iOS (notch/Dynamic Island devices), the safe area inset ensures the status bar is not hidden under the notch.

**`aria-pressed={!muted}`:** The sound toggle button uses `aria-pressed` to indicate its pressed state. Note the inversion: the button is "pressed" (active) when sound is ON (`!muted`).

---

## ErrorBoundary.tsx

```tsx
// src/components/ErrorBoundary.tsx
export default class ErrorBoundary extends Component<
  { homeUrl: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("terminal crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" …>
        <p className="text-danger">something went wrong.</p>
        <p …>reload the page, or go to the <a href={this.props.homeUrl}>main site</a>.</p>
      </div>
    );
  }
}
```

**Why a class component?** Error boundaries in React must be class components — `getDerivedStateFromError` and `componentDidCatch` have no hooks equivalent.

**`role="alert"`:** The error fallback is announced immediately by screen readers.

**Wraps the entire app:** Placed in `main.tsx` above `<App>`. Any unhandled error in the component tree shows this fallback instead of a blank page.

---

## index.html — SEO and OG Tags

```html
<!-- index.html -->
<title>rosh@portfolio</title>
<meta name="description" content="Rosh's portfolio, as an interactive terminal. Type rosh -h to get started." />

<!-- Open Graph (link previews) -->
<meta property="og:type" content="website" />
<meta property="og:title" content="rosh@portfolio" />
<meta property="og:url" content="%VITE_SITE_URL%/" />
<meta property="og:image" content="%VITE_SITE_URL%/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
```

**`%VITE_SITE_URL%`:** Vite replaces this with the `VITE_SITE_URL` env variable at build time. This sets the OG URL and image for correct link previews when the portfolio URL is shared on social media.

**`/og.png`:** A static 1200×630 image in `/public/`. Must be created manually — not generated by the app.

**NoScript fallback:**
```html
<noscript>
  <p>This portfolio is an interactive terminal and needs JavaScript to run.
    <a href="%VITE_MAIN_SITE_URL%">Visit the main site instead.</a>
  </p>
</noscript>
```

Visitors without JavaScript see a message and a link to the main site.
