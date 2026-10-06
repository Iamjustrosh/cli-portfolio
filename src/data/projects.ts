/* PLACEHOLDER CONTENT: replace with your own. Slugs must be lowercase kebab-case. */
import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "pranjal-pathshala",
    name: "Pranjal Pathshala",
    tagline: "A modern coaching institute platform for discovering courses and enrolling online.",
    description:
      "A professional coaching institute web app built to help students explore courses, view faculty profiles, and complete enrollment flows.\nBuilt with a mobile-first approach using React, Tailwind CSS, Vite, Supabase, and EmailJS, with a focus on performance, clarity, and conversion.",
    url: "https://pranjal-pathshala.vercel.app/",
  },
  {
    slug: "developer-presence",
    name: "Developer Presence",
    tagline: "A real-time developer activity system connecting VS Code with a portfolio.",
    description:
      "A three-part system that showcases live coding activity from VS Code directly on a personal portfolio.\nBuilt with a custom VS Code extension, Supabase Realtime, PostgreSQL, and React to display active projects, languages, coding duration, and workspace status with minimal latency.",
    url: "https://devpresence.iamjustrosh.in",
  },
  {
    slug: "doonverse",
    name: "DoonVerse",
    tagline: "A cinematic event registration platform with interactive digital tickets.",
    description:
      "A responsive event registration platform created for a college movie experience at IBS Dehradun.\nBuilt with React, Supabase, Tailwind CSS, Motion, and Aceternity UI, featuring registration flows, validation, secure data storage, and dynamically generated digital movie tickets.",
    url: "https://doonverse.iamjustrosh.in/",
  },
  {
    slug: "collaboard",
    name: "Collaboard",
    tagline: "A real-time collaborative whiteboard built for teams to brainstorm together.",
    description:
      "A desktop collaboration platform that enables multiple users to draw, add sticky notes, use shapes, and interact through live cursors in a shared workspace.\nBuilt with Electron, React, Supabase, tldraw, Monaco Editor, PeerJS, and modern animation tools with a focus on real-time collaboration and low-latency interaction.",
    url: "https://cb.iamjustrosh.in",
  },
  {
    slug: "code-chronicles",
    name: "Code Chronicles",
    tagline: "An interactive quiz platform for developers to test and sharpen their coding knowledge.",
    description:
      "A developer-focused quiz platform designed to help users practice programming languages, concepts, and technical knowledge.\nBuilt with React, Tailwind CSS, Supabase, and Vite, featuring dynamic questions, real-time scoring, progress tracking, and a fast, accessible interface.",
    url: "https://code-chronicles.iamjustrosh.in/",
  },
  {
    slug: "project-timer",
    name: "Project Timer",
    tagline: "A lightweight glassmorphic desktop timer built for everyday productivity.",
    description:
      "A modern desktop productivity application with timer and stopwatch modes, keyboard shortcuts, frameless window controls, and always-on-top functionality.\nOriginally built with Electron and later migrated to Tauri and Rust, reducing the final application size to around 8MB while improving startup speed and performance.",
    url: "",
  },
];
