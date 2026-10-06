 # rosh-terminal — Codebase Book

> **Goal:** After reading this book a competent engineer can answer virtually any question about this system — design rationale, architecture, data flow, edge cases, failure modes, and implementation details — without searching the source.

---

## Table of Contents 

| # | Chapter | One-line summary |
|---|---------|-----------------|
| [00](00-start-here.md) | **Start Here** | 10-minute onboarding: what this is, how to run it, where things live |
| [01](01-the-big-picture.md) | **The Big Picture** | Architecture, component boundaries, and dependency direction |
| [02](02-core-concepts.md) | **Core Concepts & Domain Model** | Blocks, Actions, Commands, Entries — the mental model |
| [03](03-engine.md) | **The Command Engine** | How typed text becomes structured output |
| [04](04-terminal-ui.md) | **Terminal UI** | The React shell: history, prompt, scroll, animations |
| [05](05-block-renderers.md) | **Block Renderers** | Every output type and how it is drawn |
| [06](06-audio-subsystem.md) | **Audio Subsystem** | Keyboard sounds, lofi player, audio state store |
| [07](07-data-layer.md) | **Data Layer** | All portfolio data, config, and types |
| [08](08-services.md) | **Services & Side Effects** | actions, leave, navigate, preload, preferences |
| [09](09-lib.md) | **Library Utilities** | Pure helper functions: age, keys, utils, motionFeatures |
| [10](10-cross-cutting.md) | **Cross-Cutting Concerns** | Styling, viewport, accessibility, error boundary |
| [11](11-key-flows.md) | **Key Flows** | End-to-end traced walkthroughs of every important journey |
| [12](12-failure-modes.md) | **Failure Modes & Edge Cases** | What can go wrong and how each case is handled |
| [13](13-how-do-i.md) | **How Do I…? (Cookbook)** | Common change recipes with real file references |
| [14](14-glossary.md) | **Glossary** | Every domain and codebase-specific term defined |

### Quizzes (active recall)

| Quiz | Chapter |
|------|---------|
| [00-start-here-quiz](quizzes/00-start-here-quiz.md) | Start Here |
| [01-big-picture-quiz](quizzes/01-big-picture-quiz.md) | The Big Picture |
| [02-core-concepts-quiz](quizzes/02-core-concepts-quiz.md) | Core Concepts |
| [03-engine-quiz](quizzes/03-engine-quiz.md) | The Command Engine |
| [04-terminal-ui-quiz](quizzes/04-terminal-ui-quiz.md) | Terminal UI |
| [05-block-renderers-quiz](quizzes/05-block-renderers-quiz.md) | Block Renderers |
| [06-audio-quiz](quizzes/06-audio-quiz.md) | Audio Subsystem |
| [07-data-layer-quiz](quizzes/07-data-layer-quiz.md) | Data Layer |
| [Final Exam](quizzes/NN-final-exam.md) | All chapters interleaved |

---

## Coverage Map

Every meaningful code cluster is accounted for below.

| Cluster | Chapter | Load-bearing? |
|---------|---------|---------------|
| `src/main.tsx` | 00, 01 | Boilerplate bootstrap |
| `src/App.tsx` | 01, 08 | YES — Orchestration root |
| `src/engine/types.ts` | 02 | YES — Core type definitions |
| `src/engine/execute.ts` | 03 | YES — Central dispatch |
| `src/engine/blocks.ts` | 02, 03 | YES — Unit counting |
| `src/engine/commands/index.ts` | 03 | YES — Registry |
| `src/engine/commands/rosh.ts` | 03 | YES — Help generator |
| `src/engine/commands/cat.ts` | 03 | YES — File reader |
| `src/engine/commands/ls.ts` | 03 | YES — Directory lister |
| `src/engine/commands/run.ts` | 03 | YES — Project opener / resume |
| `src/engine/commands/audio.ts` | 03, 06 | YES — play / stop commands |
| `src/engine/commands/fastfetch.ts` | 03 | YES — About-me block |
| `src/engine/commands/clear.ts` | 03 | YES — Screen clear |
| `src/engine/commands/exit.ts` | 03 | YES — Redirect to main site |
| `src/engine/commands/helpers.ts` | 03 | YES — ok / fail factories |
| `src/hooks/useTerminal.ts` | 04 | YES — Core terminal state |
| `src/hooks/useKeySound.ts` | 04, 06 | YES — Physical typing sounds |
| `src/hooks/useStickToBottom.ts` | 04 | YES — Scroll pinning |
| `src/hooks/useViewportHeight.ts` | 10 | YES — iOS keyboard fix |
| `src/hooks/useAudio.ts` | 06 | YES — Status bar audio binding |
| `src/components/terminal/Terminal.tsx` | 04 | YES — Top-level shell |
| `src/components/terminal/History.tsx` | 04 | YES — Past entries list |
| `src/components/terminal/Entry.tsx` | 04 | YES — Single command+output |
| `src/components/terminal/Prompt.tsx` | 04 | YES — Active input line |
| `src/components/terminal/Cursor.tsx` | 04, 10 | YES — Block cursor |
| `src/components/terminal/CommandLine.tsx` | 04 | YES — Frozen command echo |
| `src/components/terminal/PromptLabel.tsx` | 04 | Boilerplate label |
| `src/components/blocks/BlockRenderer.tsx` | 05 | YES — Block dispatch |
| `src/components/blocks/ListBlock.tsx` | 05 | YES — Two-column list |
| `src/components/blocks/JsonBlock.tsx` | 05 | YES — Syntax-colored JSON |
| `src/components/blocks/FastfetchBlock.tsx` | 05 | YES — Profile card |
| `src/components/blocks/TextBlock.tsx` | 05 | YES — Plain text |
| `src/components/blocks/ErrorBlock.tsx` | 05 | YES — Error text |
| `src/components/blocks/SpacerBlock.tsx` | 05 | Boilerplate spacer |
| `src/components/blocks/Reveal.tsx` | 05 | YES — Entry animation |
| `src/components/layout/StatusBar.tsx` | 10 | YES — Top bar |
| `src/components/layout/Container.tsx` | 10 | Boilerplate layout |
| `src/components/ErrorBoundary.tsx` | 12 | YES — Crash fallback |
| `src/services/audio.ts` | 06 | YES — Audio init + unlock |
| `src/services/audioStore.ts` | 06 | YES — Shared audio state |
| `src/services/keySound.ts` | 06 | YES — Web Audio key sounds |
| `src/services/lofi.ts` | 06 | YES — Lofi music player |
| `src/services/actions.ts` | 08 | YES — Side-effect dispatcher |
| `src/services/leave.ts` | 08 | YES — Page fade + redirect |
| `src/services/navigate.ts` | 08 | Thin wrapper |
| `src/services/preload.ts` | 08 | YES — Logo preload |
| `src/services/preferences.ts` | 08 | YES — localStorage mute pref |
| `src/lib/age.ts` | 09 | YES — Age calculator |
| `src/lib/keys.ts` | 09 | YES — Key classifier |
| `src/lib/utils.ts` | 09 | YES — rand, isModifierKey |
| `src/lib/motionFeatures.ts` | 09 | YES — Lazy motion bundle |
| `src/data/config.ts` | 07 | YES — Runtime config |
| `src/data/profile.ts` | 07 | YES — Owner profile |
| `src/data/projects.ts` | 07 | YES — Project list |
| `src/data/experience.ts` | 07 | YES — Work history |
| `src/data/links.ts` | 07 | YES — Contact links |
| `src/data/stack.ts` | 07 | YES — Tech stack JSON |
| `src/data/books.ts` | 07 | YES — Reading list |
| `src/data/games.ts` | 07 | YES — Games list |
| `src/data/gears.ts` | 07 | YES — Gear list |
| `src/data/types.ts` | 07 | YES — Shared data types |
| `src/index.css` | 10 | YES — Design system |
| `index.html` | 10 | YES — SEO / OG tags |
| `vite.config.ts` | 13 | YES — Build config |
| `tsconfig.json` | 13 | YES — TS config |
| `vercel.json` | 13 | YES — Deployment headers |
| `tests/` (12 files) | 12 | YES — Test suite |

---

## Residual Open Questions

- `src/services/navigate.ts` is a one-liner thin wrapper over `window.location.href` assignment, not fully documented inline.
- `src/data/books.ts`, `games.ts`, `gears.ts` are simple data arrays with no logic — boilerplate content only.
- `src/components/terminal/PromptLabel.tsx` is a static label component showing `rosh@portfolio ~ %` — not load-bearing.
