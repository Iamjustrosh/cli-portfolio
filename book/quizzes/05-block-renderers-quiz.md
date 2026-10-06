# Quiz 05 — Block Renderers

*Try closed-book first, then check answers and re-read the cited code.*

---

**Q1** [Recall] A `TextBlock` with `measure=true` has what CSS effect?

A) `width: 100%`  
B) `max-width: 80ch`  
C) `white-space: pre-wrap`  
D) `overflow-wrap: break-word`  

---

**Q2** [Trace] `ListBlock` uses a clever trick to keep columns stable while rows fade in. How is the left column width calculated?

A) Using CSS grid auto-columns  
B) JavaScript calculates the max length of all rows (even hidden ones) and sets a CSS variable  
C) Using a standard HTML `<table>`  
D) It relies on monospace font metrics  

---

**Q3** [Apply] You want to add a new color to the `JsonBlock` tokenizer. Which file do you edit?

A) `src/index.css`  
B) `src/components/blocks/JsonBlock.tsx`  
C) `src/engine/blocks.ts`  
D) `tailwind.config.js`  

---

**Q4** [Design] Why are the 10 color swatches in `FastfetchBlock` marked with `aria-hidden="true"`?

A) Because screen readers can't read colors  
B) Because they are purely decorative and add no semantic information  
C) To improve rendering performance  
D) It's a bug, they shouldn't be hidden  

---

**Q5** [Trace] A command returns `{ type: "error", text: "bad file" }`. What color is this text rendered in?

A) `text-neutral-400`  
B) `text-neutral-50`  
C) `text-danger` (red)  
D) `text-accent` (green)  

---

## Answers

---

**A1: B** (`src/index.css:23-25`)  
The `@utility measure` applies `max-width: 80ch`. Used to cap the width of long prose blocks for readability.

**A2: B** (`src/components/blocks/ListBlock.tsx:16-17`)  
```ts
const labelWidth = Math.max(...rows.map((row) => row.label.length));
// ...
<div style={{ "--label-w": `${labelWidth}ch` } as CSSProperties}>
```
This ensures the left column takes up exactly the space needed for the longest label, preventing the right column from jumping around as rows appear one by one.

**A3: B** (`src/components/blocks/JsonBlock.tsx:14-20`)  
The `KIND_CLASS` map defines the Tailwind colors for each JSON token kind (`key`, `string`, `literal`, `punct`).

**A4: B** (`src/components/blocks/FastfetchBlock.tsx:45`)  
Decorative elements that don't convey meaning should be hidden from assistive technology to reduce noise.

**A5: C** (`src/components/blocks/ErrorBlock.tsx:10`)  
`ErrorBlock` hardcodes the `text-danger` class, which maps to `var(--color-danger)` (red) in `index.css`.
