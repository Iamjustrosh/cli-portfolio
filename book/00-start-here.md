# Chapter 00 — Start Here

> **What you'll be able to answer after this chapter:**
> What does `rosh-terminal` do? Who uses it? How do I run it locally? Where do the files live? What's the first thing to change to make it my own?

---

## What Is This?

`rosh-terminal` is a **browser-based interactive terminal that serves as a developer portfolio**. Instead of a traditional portfolio website, the owner (`rosh`) presents their work through a fake Unix-like shell: visitors type commands (or click them) and the terminal prints information about projects, experience, skills, and contact links.

The terminal is **not a general shell**. It runs a fixed set of commands against hard-coded content — it never touches a real filesystem or server. Its goal is to be memorable: the terminal aesthetic is the differentiator.

**Who uses it:** Recruiters, engineers, and curious people who land on the portfolio URL.

---

## Run It Locally

```bash
# 1. Install dependencies (uses Bun, but npm works too)
bun install         # or: npm install

# 2. Start the dev server
bun run dev         # or: npm run dev
# → http://localhost:5173

# 3. Run the test suite
bun run test        # or: npm test

# 4. Type-check without emitting
bun run typecheck   # or: npm run typecheck

# 5. Production build
bun run build       # or: npm run build
```

The `.env.example` shows the two env vars you need:

```
VITE_MAIN_SITE_URL=https://your-main-site.com   # where `exit` redirects
VITE_SITE_URL=https://your-terminal-site.com    # used in og:url meta tag
```

Copy `.env.example` to `.env` and fill them in before running.

---

## The Mental Model (3 concepts to hold in your head)

1. **Engine vs. UI** — the command engine (`src/engine/`) is pure TypeScript with no React. It converts a string like `"cat experience.txt"` into a `Block[]` (what to display) and `Action[]` (what side effects to perform). The React UI displays whatever the engine returns.

2. **Blocks** — the atomic output unit. Every command returns an array of typed blocks: `text`, `error`, `list`, `json`, `fastfetch`, `spacer`. The UI renders each block type differently.

3. **Reveal animation** — output doesn't appear all at once. It counts the *units* (rows for a list, lines for JSON, 1 for anything else) and reveals them one by one at ~34ms intervals, creating a typewriter effect.

---

## Where Things Live

```
rosh-terminal/
├── src/
│   ├── main.tsx            ← React bootstrap (ErrorBoundary + App)
│   ├── App.tsx             ← Root component: layout + startup effects
│   ├── index.css           ← Tailwind base + design tokens + cursor CSS
│   │
│   ├── engine/             ← PURE TS — no React; the brain of the terminal
│   │   ├── types.ts        ← Block, Action, Command, ExecResult types
│   │   ├── execute.ts      ← normalize() + execute() — the dispatcher
│   │   ├── blocks.ts       ← unitCount/unitTotal (for reveal pacing)
│   │   └── commands/       ← one file per command + index (registry)
│   │
│   ├── hooks/              ← React hooks
│   │   ├── useTerminal.ts  ← ALL terminal state (entries, input, status)
│   │   ├── useKeySound.ts  ← keyboard → sound routing
│   │   ├── useStickToBottom.ts ← scroll-pinning logic
│   │   ├── useViewportHeight.ts ← iOS keyboard height fix
│   │   └── useAudio.ts     ← status-bar subscription to audioStore
│   │
│   ├── components/
│   │   ├── terminal/       ← Terminal, History, Entry, Prompt, Cursor, …
│   │   ├── blocks/         ← BlockRenderer, ListBlock, JsonBlock, …
│   │   ├── layout/         ← StatusBar, Container
│   │   └── ErrorBoundary.tsx
│   │
│   ├── services/           ← Side effects and mutable singletons
│   │   ├── actions.ts      ← Dispatches Action → real browser behavior
│   │   ├── audio.ts        ← Startup audio init (gesture unlock)
│   │   ├── audioStore.ts   ← Mutable shared store for muted/playing
│   │   ├── keySound.ts     ← Web Audio API key sound engine
│   │   ├── lofi.ts         ← HTML audio lofi player with fades
│   │   ├── leave.ts        ← Page fade-out before redirect
│   │   ├── navigate.ts     ← window.location.href wrapper
│   │   ├── preload.ts      ← Preloads the fastfetch logo
│   │   └── preferences.ts  ← localStorage mute preference
│   │
│   ├── data/               ← Portfolio content (replace with your own)
│   │   ├── config.ts       ← URLs, keyboard pack, lofi track settings
│   │   ├── profile.ts      ← Name, DOB, location, summary
│   │   ├── projects.ts     ← Project list (slug, name, description, url)
│   │   ├── experience.ts   ← Work history
│   │   ├── links.ts        ← Contact links
│   │   ├── stack.ts        ← Tech stack (shown as JSON)
│   │   ├── books.ts        ← Reading list
│   │   ├── games.ts        ← Games list
│   │   ├── gears.ts        ← Gear / tools list
│   │   └── types.ts        ← TypeScript interfaces for all data
│   │
│   └── lib/                ← Pure utility functions (no side effects)
│       ├── age.ts          ← ageFromBirthDate(dateStr)
│       ├── keys.ts         ← classifyKey, classifyInputChange, isVirtualKey
│       ├── utils.ts        ← rand(min,max), isModifierKey(key)
│       └── motionFeatures.ts ← Lazy-loaded motion/react bundle
│
├── tests/                  ← Vitest test suite (12 files)
├── public/                 ← Static assets (logo.svg, audio/, og.png)
├── index.html              ← HTML entry point with OG/Twitter meta
├── vite.config.ts          ← Vite + React + Tailwind + @/* alias
├── tsconfig.json           ← TypeScript (strict, noUnused*)
├── vercel.json             ← Cache-Control + security headers
└── package.json            ← Scripts + deps
```

---

## Your First Change

**To add a project**, edit `src/data/projects.ts`:

```ts
// src/data/projects.ts
{
  slug: "my-app",             // visitors type: cat my-app.txt, run my-app
  name: "My App",
  tagline: "one-line shown in ls projects",
  description: "Two-paragraph description shown by cat my-app.txt.",
  url: "https://my-app.com", // where run my-app opens
}
```

No other files need changing. The `cat`, `ls`, and `run` commands all read from this array dynamically.

**To change the person's profile** (shown by `fastfetch`), edit `src/data/profile.ts`.

**To change the keyboard sound pack**, change `config.keyboard.pack` in `src/data/config.ts` to one of: `alpaca`, `blackink`, `bluealps`, `boxnavy`, `cream`, `holypanda`, `mxblack`, `mxblue`, `mxbrown`, `redink`, `topre`, `turquoise`.

---

**→ Check your understanding:** [quizzes/00-start-here-quiz.md](quizzes/00-start-here-quiz.md)
