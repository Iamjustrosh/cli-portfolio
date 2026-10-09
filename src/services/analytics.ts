import { projects } from "@/data/projects";
import { registry } from "@/engine/commands";
import { normalize } from "@/engine/execute";

/**
 * Umami (hosted) analytics. Privacy rules built in:
 *  - nothing is sent unless VITE_UMAMI_WEBSITE_ID is set, never in dev, and never when
 *    the browser says Do Not Track
 *  - events carry only KNOWN names (a command name, a project slug), never what was typed:
 *    anything unknown is reported as "unknown"
 *
 * Events: the page view (automatic), `command` { name }, `project-view` { slug },
 * `project-open` { slug }, and `resume-download` (the `resume` command).
 */

const DEFAULT_SRC = "https://cloud.umami.is/script.js";
const SCRIPT_ID = "umami-script";

interface Umami {
  track: (event: string, data?: Record<string, string | number>) => void;
}
declare global {
  interface Window {
    umami?: Umami;
  }
}

export interface AnalyticsOptions {
  websiteId?: string;
  /** Script URL. Only needed when self-hosting. */
  src?: string;
  /** This site's own public URL. Its host limits tracking to the real domain (not previews or localhost). */
  siteUrl?: string;
  /** Defaults to Vite's dev-server flag. */
  dev?: boolean;
}

function doNotTrack(): boolean {
  const flag = navigator.doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack;
  return flag === "1" || flag === "yes";
}

function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

/** Adds the Umami script once. Safe to call repeatedly (React Strict Mode, hot reload). */
export function initAnalytics(options: AnalyticsOptions = {}): void {
  const websiteId = options.websiteId ?? (import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined);
  const src = options.src ?? (import.meta.env.VITE_UMAMI_SRC as string | undefined) ?? DEFAULT_SRC;
  const siteUrl = options.siteUrl ?? (import.meta.env.VITE_SITE_URL as string | undefined);
  const dev = options.dev ?? import.meta.env.DEV;

  if (!websiteId || dev || doNotTrack()) return;
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.defer = true;
  script.src = src || DEFAULT_SRC;
  script.dataset.websiteId = websiteId;
  script.dataset.doNotTrack = "true";
  const domain = hostOf(siteUrl);
  if (domain) script.dataset.domains = domain;
  document.head.appendChild(script);
}

function track(event: string, data?: Record<string, string | number>): void {
  try {
    // not loaded yet, blocked, or disabled: quietly skip
    if (data) window.umami?.track(event, data);
    else window.umami?.track(event);
  } catch {
    /* analytics must never break the terminal */
  }
}

/** Report one command the visitor ran. Call with the raw text; only known names leave this function. */
export function trackCommand(raw: string): void {
  const line = normalize(raw);
  if (!line) return;

  const [verb, ...args] = line.split(" ");
  const command = registry.get(verb);
  track("command", { name: command ? command.name : "unknown" });
  if (!command) return;

  if (command.name === "resume" && args.length === 0) {
    track("resume-download");
    return;
  }
  if (args.length !== 1) return;

  const target = args[0];
  const isProject = (slug: string) => projects.some((project) => project.slug === slug);

  if (command.name === "cat" && target.endsWith(".txt")) {
    const slug = target.slice(0, -".txt".length);
    if (isProject(slug)) track("project-view", { slug });
  } else if (command.name === "run" && isProject(target)) {
    track("project-open", { slug: target });
  }
}
