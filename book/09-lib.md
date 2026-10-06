# Chapter 09 — Library Utilities

> **What you'll be able to answer after this chapter:**
> What does each lib function do? What are their preconditions? What edge cases do they handle? Why are they separated from the rest of the code?

---

## Overview

`src/lib/` contains **pure, side-effect-free utility functions** that are shared across the codebase. None of them import from `components/`, `hooks/`, `services/`, or `data/`.

| File | Functions | Used by |
|------|-----------|---------|
| `age.ts` | `ageFromBirthDate()` | fastfetch command |
| `keys.ts` | `classifyKey()`, `classifyInputChange()`, `isVirtualKey()` | useKeySound, keySound.ts |
| `utils.ts` | `rand()`, `isModifierKey()` | useTerminal (rand), Prompt (isModifierKey) |
| `motionFeatures.ts` | (re-export only) | App.tsx (LazyMotion) |

---

## age.ts

### `ageFromBirthDate(dateOfBirth: string, today: Date = new Date()): number`

```ts
// src/lib/age.ts
export function ageFromBirthDate(dateOfBirth: string, today: Date = new Date()): number {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = today.getFullYear() - year;
  const hadBirthdayThisYear =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}
```

**Precondition:** `dateOfBirth` must be in `"YYYY-MM-DD"` format. No validation is performed; a malformed string will produce `NaN` for `year/month/day` and an incorrect age.

**The birthday check:** `today.getMonth()` is 0-indexed (Jan = 0), so `+1` converts to 1-indexed to match the `YYYY-MM-DD` month. The visitor's birthday is considered "had" if today's month is after the birth month, OR today is the exact birthday or later in the birth month.

**The `today` parameter:** Injected for testability. `tests/age.test.ts` passes explicit `Date` objects to test birthday edge cases without depending on the system clock.

**Edge cases tested:**
- Day before birthday: age is `currentYear - birthYear - 1`.
- Exact birthday: age is `currentYear - birthYear`.
- Day after birthday: age is `currentYear - birthYear`.
- Leap year birthdays (Feb 29): treated as a normal date — the function doesn't special-case this.

---

## keys.ts

### `classifyKey(key: string): KeyKind | null`

```ts
// src/lib/keys.ts
export type KeyKind = "generic" | "backspace" | "enter" | "space";

const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn", "AltGraph"]);

export function classifyKey(key: string): KeyKind | null {
  if (MODIFIERS.has(key)) return null;          // modifier keys are silent
  if (key === " " || key === "Spacebar") return "space";
  if (key === "Enter") return "enter";
  if (key === "Backspace") return "backspace";
  return "generic";
}
```

**Returns `null`:** Modifier keys (Shift, Ctrl, Alt, Meta, CapsLock, etc.) are silent — they shouldn't trigger a key sound on their own.

**`"Spacebar"` alias:** Older browsers reported spacebar as `"Spacebar"` instead of `" "`. Both are handled.

**`"generic"` catch-all:** Any key not specifically classified (letters, numbers, punctuation, arrow keys, etc.) uses the generic sound pool.

### `classifyInputChange(previous: string, next: string): KeyKind | null`

```ts
// src/lib/keys.ts
export function classifyInputChange(previous: string, next: string): KeyKind | null {
  if (next.length < previous.length) return "backspace";
  if (next.length > previous.length) return next.endsWith(" ") ? "space" : "generic";
  return null;  // length unchanged (e.g. text replacement of same length)
}
```

Used for Android virtual keyboards where `event.key` is always `"Unidentified"`. The sound is inferred from what changed in the input value:
- Shorter → backspace.
- Longer, ending with space → space.
- Longer, not ending with space → generic.
- Same length → nothing (could be an autocorrect replacement; silence is safe).

### `isVirtualKey(key: string, keyCode: number): boolean`

```ts
// src/lib/keys.ts
export function isVirtualKey(key: string, keyCode: number): boolean {
  return key === "Unidentified" || keyCode === 229;
}
```

`keyCode === 229` is the standard code for IME composition events, which also can't be classified. This catches both Android virtual keyboards and Japanese/Chinese IME input on desktop.

---

## utils.ts

### `rand(min: number, max: number): number`

```ts
// src/lib/utils.ts
export function rand(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}
```

Returns a random integer in `[min, max]` (inclusive, rounded). Used in `useTerminal` to vary the per-character typing delay: `rand(28, 62)` ms per character, creating the "human typing" simulation.

**Precondition:** `min <= max`. No validation; violation produces nonsense output.

### `isModifierKey(key: string): boolean`

```ts
// src/lib/utils.ts
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn"]);

export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key);
}
```

Used in `Prompt.tsx` to decide whether a key press while the terminal is busy should trigger `skip()`. The intention is: "any real key finishes the animation, but modifier keys alone don't." Pressing Shift+A while output is revealing would fire `skip()` from the `A` keydown, not the Shift keydown.

**Note:** This set is slightly different from `keys.ts`'s `MODIFIERS` set (which includes `"AltGraph"`). The `AltGraph` key produces characters on some keyboard layouts (e.g., European keyboards), so it's treated as a real key in `classifyKey` but not in `isModifierKey`. This is consistent: AltGraph alone plays a sound but doesn't skip animations (it would typically be part of a character combo).

Actually, reviewing the code: `AltGraph` is in the `MODIFIERS` set in `keys.ts` (returns `null` for sound), but NOT in `MODIFIER_KEYS` in `utils.ts` (would trigger `skip()`). This is a minor inconsistency — pressing AltGraph alone while output is revealing would skip the animation. This is unlikely to matter in practice since AltGraph is always used in combination with another key.

---

## motionFeatures.ts

```ts
// src/lib/motionFeatures.ts
/** Loaded on demand by <LazyMotion> in App.tsx, so it ships as its own small chunk. */
export { domAnimation as default } from "motion/react";
```

This is a re-export that exists solely to be the target of a dynamic `import()` in `App.tsx`:

```ts
// src/App.tsx
const loadMotionFeatures = () => import("@/lib/motionFeatures").then((module) => module.default);
```

**Why the indirection?** `LazyMotion` accepts a `features` prop that must be a function returning a promise of the feature bundle. Vite code-splits dynamic imports into separate chunks. Without the indirection, you'd need to inline the dynamic import in `App.tsx`, which is less clean.

**`domAnimation` vs `domMax`:** The `domAnimation` bundle includes the features needed for basic animations (opacity, transform, etc.) but not the full feature set (SVG animations, layout animations, etc.). Since the codebase only uses `opacity` + `y` translate, `domAnimation` is sufficient and smaller.

---

**Where to look:**
- `src/lib/age.ts` — the birthday calculation.
- `src/lib/keys.ts` — the virtual keyboard and key classification logic.
- `src/lib/utils.ts` — the random number generator and modifier key check.
- `tests/age.test.ts` — edge cases for the age calculator.
- `tests/keys.test.ts` — key classification edge cases.
