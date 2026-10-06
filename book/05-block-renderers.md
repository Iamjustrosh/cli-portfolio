# Chapter 05 — Block Renderers

> **What you'll be able to answer after this chapter:**
> What does each block type look like on screen? How does the reveal animation work? How does JSON syntax highlighting work? How does the list's two-column layout stay stable as rows appear?

---

## Overview

Block renderers live in `src/components/blocks/`. There is one component per block type, plus a `BlockRenderer` dispatcher and a shared `Reveal` animation wrapper.

| File | Renders | Notes |
|------|---------|-------|
| `BlockRenderer.tsx` | All types (switch dispatch) | Entry point |
| `TextBlock.tsx` | `text` | Tones, measure width |
| `ErrorBlock.tsx` | `error` | Red color |
| `ListBlock.tsx` | `list` | Two-column, clickable rows |
| `JsonBlock.tsx` | `json` | Per-line syntax coloring |
| `FastfetchBlock.tsx` | `fastfetch` | Logo + profile card |
| `SpacerBlock.tsx` | `spacer` | Empty div |
| `Reveal.tsx` | (wrapper) | Fade-in entrance animation |

---

## BlockRenderer — The Dispatcher

```tsx
// src/components/blocks/BlockRenderer.tsx
export default function BlockRenderer({ block, visible, animate, onRun }) {
  switch (block.type) {
    case "text":      return <TextBlock text={block.text} tone={block.tone} measure={block.measure} animate={animate} />;
    case "error":     return <ErrorBlock text={block.text} animate={animate} />;
    case "list":      return <ListBlock rows={block.rows} visible={visible} animate={animate} onRun={onRun} />;
    case "json":      return <JsonBlock lines={block.lines} visible={visible} animate={animate} />;
    case "spacer":    return <SpacerBlock />;
    case "fastfetch": return <FastfetchBlock logo={block.logo} heading={block.heading} subheading={block.subheading} rows={block.rows} animate={animate} />;
  }
}
```

**`visible` is only meaningful for `list` and `json`:** Text, error, fastfetch, and spacer are 1-unit blocks — they are either shown or not. List and JSON use `visible` to slice their rows/lines.

**TypeScript exhaustiveness:** The `switch` covers all six block types. TypeScript's `noFallthroughCasesInSwitch` and strict checking ensure this stays complete.

---

## Reveal — The Entrance Animation

```tsx
// src/components/blocks/Reveal.tsx
export default function Reveal({ animate, className, children }) {
  return (
    <m.div
      className={className}
      initial={animate ? { opacity: 0, y: 3 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
```

**`initial={animate ? { opacity: 0, y: 3 } : false}`:** When `animate` is true (the entry is actively being revealed), the element starts invisible and 3px below. When `animate` is false (entry is already done, reduced motion, or a re-render of a finished entry), `false` means "no initial animation — render at final state immediately."

**Why `y: 3` and not more:** 3px is subtle — enough to give a sense of "appearing from below" without looking like a loading spinner. Too large a value would feel jarring for monospace terminal output.

**`m.div` from `motion/react`:** The `m` import is the tree-shakeable version. The full animation features are loaded lazily via `LazyMotion` in `App.tsx`.

---

## ListBlock — Two-Column Stable Layout

```tsx
// src/components/blocks/ListBlock.tsx
export default function ListBlock({ rows, visible, animate, onRun }) {
  const labelWidth = Math.max(...rows.map((row) => row.label.length));

  return (
    <div className="flex flex-col gap-2 sm:gap-1" style={{ "--label-w": `${labelWidth}ch` } as CSSProperties}>
      {rows.slice(0, visible).map((row, index) => (
        <Reveal key={index} animate={animate} className="flex flex-col sm:flex-row sm:gap-6">
          <span className="sm:w-[var(--label-w)] sm:shrink-0">
            {row.command ? (
              <button type="button" onClick={() => onRun(row.command!)}
                className="min-h-6 w-fit text-left text-neutral-300 underline …">
                {row.label}
              </button>
            ) : (
              <span className="text-neutral-300">{row.label}</span>
            )}
          </span>
          {row.detail && row.href ? <a href={row.href} …>{row.detail}</a>
           : row.detail ? <span className="text-neutral-400 …">{row.detail}</span>
           : null}
        </Reveal>
      ))}
    </div>
  );
}
```

**Column width stabilization trick:** `labelWidth = Math.max(...rows.map(r => r.label.length))` is computed from **all rows** (not just visible ones). This is set as `--label-w` on the container. Each label column is `sm:w-[var(--label-w)]`. Result: as rows reveal one by one, the left column width never changes, so the detail column never jumps horizontally.

**`rows.slice(0, visible)`:** Only renders up to `visible` rows. The `Reveal` wrapper fades each row in as it becomes visible.

**Detail rendering — three cases:**
1. `detail + href` → external link (`<a target="_blank" rel="noopener noreferrer">`).
2. `detail` only → muted `<span>`.
3. No detail → renders nothing.

**`min-h-6` on buttons and links:** Ensures a minimum touch target of 24px for mobile accessibility.

---

## JsonBlock — Syntax Coloring

The `json` block receives pre-split lines (e.g., from `JSON.stringify(stack, null, 2).split("\n")`). Each line is tokenized into colored spans.

### Tokenizer

```ts
// src/components/blocks/JsonBlock.tsx
type Kind = "key" | "string" | "literal" | "punct";
const KIND_CLASS: Record<Kind | "space", string> = {
  key:     "text-neutral-50",
  string:  "text-neutral-300",
  literal: "text-neutral-300",
  punct:   "text-neutral-400",
  space:   "",
};

const LINE    = /^(\s*)(?:("(?:[^"\\]|\\.)*")(\s*:\s*))?(.*)$/;
const STRING  = /^("(?:[^"\\]|\\.)*")(.*)$/;
const BRACKETS = /^[[\]{},]+$/;

function tokenize(line: string): Token[] {
  const match = LINE.exec(line);
  const [, indent, key, colon, rest] = match;
  // ... builds token array
}
```

**The regex approach (`LINE`):** Matches:
1. Leading whitespace (indent).
2. Optionally a JSON key (`"something":`) — captured as `key` + `colon`.
3. Everything remaining (`rest`).

Then `rest` is checked:
- If it matches `STRING` regex (a quoted string value): colored as `string`.
- If it's only brackets/commas (`BRACKETS`): colored as `punct`.
- Otherwise (numbers, `true`, `false`, `null`): colored as `literal`.

**Design choice — neutral colors only:** All JSON colors use neutral shades, not the typical JSON highlighter green/blue/orange. This keeps the terminal's monochromatic aesthetic.

---

## FastfetchBlock — Profile Card

```tsx
// src/components/blocks/FastfetchBlock.tsx
const PALETTE = ["bg-neutral-50", "bg-neutral-100", … "bg-neutral-900"];

export default function FastfetchBlock({ logo, heading, subheading, rows, animate }) {
  return (
    <Reveal animate={animate}>
      <div className="flex flex-col gap-5 py-2 sm:flex-row sm:gap-10">
        <img src={logo.src} alt={logo.alt} width={160} height={160}
          className="h-24 w-24 shrink-0 object-contain object-left sm:h-40 sm:w-40" />
        <div className="min-w-0">
          <div className="font-pixel text-2xl leading-tight text-neutral-50 sm:text-3xl">{heading}</div>
          <div className="text-neutral-400">{subheading}</div>
          <dl className="mt-3 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1">
            {rows.map((row) => (
              <Fragment key={row.label}>
                <dt className="text-neutral-50">{row.label}:</dt>
                <dd className="measure text-neutral-300">{row.value}</dd>
              </Fragment>
            ))}
          </dl>
          <div aria-hidden="true" className="mt-4 flex w-fit outline outline-1 outline-neutral-800">
            {PALETTE.map((color) => <span key={color} className={`h-4 w-6 ${color}`} />)}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
```

**`font-pixel`:** The heading uses the `Geist Pixel` font — a pixel-art aesthetic font that mimics terminal ASCII art logos. It is defined as `--font-pixel` in the design system.

**`dl` / `dt` / `dd` grid:** The metadata rows use a definition list with a two-column CSS grid (`grid-cols-[max-content_minmax(0,1fr)]`). The `dt` column is as wide as its widest content; the `dd` column takes the rest.

**Color palette strip:** The 10 neutral swatches at the bottom (light to dark) mimic the color row in the real `fastfetch` Linux tool — the signature visual flourish of the fastfetch format.

**`aria-hidden="true"` on the palette:** The swatches are decorative and add no information, so they are hidden from screen readers.

---

## TextBlock and ErrorBlock

These are the simplest renderers:

```tsx
// TextBlock — uses Reveal for the fade-in
export default function TextBlock({ text, tone, measure, animate }) {
  const toneClass = tone === "muted" ? "text-neutral-400" : tone === "strong" ? "text-neutral-50" : "";
  return (
    <Reveal animate={animate} className={`${toneClass} ${measure ? "measure" : ""} whitespace-pre-wrap [overflow-wrap:anywhere]`}>
      {text}
    </Reveal>
  );
}

// ErrorBlock — hardcoded red color
export default function ErrorBlock({ text, animate }) {
  return <Reveal animate={animate} className="text-danger whitespace-pre-wrap">{text}</Reveal>;
}
```

**`whitespace-pre-wrap`:** Preserves newlines in text (used for multi-line experience summaries and project descriptions).

**`[overflow-wrap:anywhere]`:** Allows long URLs or unspaced text to wrap at any character, preventing horizontal overflow.

**`measure` utility:** From `index.css:23-25`, caps width to `max-width: 80ch`. Applied to `TextBlock` when `measure=true` (long prose), not applied to list/table data.

---

**→ Check your understanding:** [quizzes/05-block-renderers-quiz.md](quizzes/05-block-renderers-quiz.md)
