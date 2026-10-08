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
VITE_SITE_URL=https://your-terminal-site.com    # used in og:url meta tag
```

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
- **Testing**: Vitest

## License

MIT