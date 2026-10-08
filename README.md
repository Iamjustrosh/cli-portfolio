# rosh-terminal

A browser-based interactive terminal portfolio. Instead of a traditional portfolio website, this project presents the owner's work through a fake Unix-like shell: visitors type commands (or click them) to print information about projects, experience, skills, and contact links.

## Quick Start

```bash
# 1. Install dependencies (uses Bun, but npm works too)
bun install         # or: npm install

# 2. Start the dev server
bun run dev         # or: npm run dev
# → http://localhost:5173

# 3. Run the test suite
bun run test        # or: npm test
```

## Environment Variables

Copy `.env.example` to `.env` and fill it in:

```
VITE_MAIN_SITE_URL=https://your-main-site.com   # where `exit` redirects
VITE_SITE_URL=https://your-terminal-site.com    # used in og:url meta tag (no trailing slash)
VITE_UMAMI_WEBSITE_ID=                          # optional: turns analytics on
# VITE_UMAMI_SRC=https://your-umami-host/script.js   # optional: only if you self-host Umami
```

## Analytics (Umami)

Analytics is **off** unless `VITE_UMAMI_WEBSITE_ID` is set. It is also off in development and for visitors whose browser sends Do Not Track, and it is limited to the host of `VITE_SITE_URL`, so previews and localhost are never counted.

What is recorded (code: `src/services/analytics.ts`):

- the page view (automatic)
- `command` with the command name, e.g. `ls` or `cat`. Anything that is not a real command is recorded only as `unknown`. Nothing a visitor typed is ever sent.
- `project-view` and `project-open` with the project slug, and `resume-download`

The automatic `rosh --help` on load is not counted.

To turn it on: create a website in Umami Cloud, copy its Website ID, set `VITE_UMAMI_WEBSITE_ID` in Vercel (Project Settings → Environment Variables), and redeploy. Env variables are baked in at build time.

## How to Customize

All portfolio content and runtime configuration lives in `src/data/`. **You do not need to edit any React components or engine logic to personalize the terminal.**

- `src/data/config.ts`: Main settings (URLs, keyboard sound pack, lofi track)
- `src/data/profile.ts`: Fastfetch card data
- `src/data/projects.ts`: Your projects list (`ls projects`, `cat <slug>.txt`, `run <slug>`)
- `src/data/experience.ts`: Work experience (`cat experience.txt`)
- `src/data/stack.ts`: Tech stack (`cat stack.json`)
- `src/data/links.ts`: Contact info (`cat connect.txt`)

## The Codebase Book

This repository includes a comprehensive, reference-grade "book" that documents every design decision, component boundary, data flow, and edge case. 

If you want to understand how the pure TypeScript command engine works without touching React, how the Web Audio API powers low-latency mechanical keyboard sounds, or how the hidden-input prompt accessible hack works, start here:

👉 **[Read the Codebase Book](book/README.md)**

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (strict)
- **Animation**: motion/react (framer-motion)
- **Audio**: Web Audio API (key sounds) + HTML5 Audio (lofi player)
- **Analytics**: Umami (optional, privacy-friendly)
- **Testing**: Vitest

## License

MIT
