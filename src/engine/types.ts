/**
 * Engine types. The engine turns a typed string into DATA (blocks + actions).
 * It never touches React or the DOM.
 */

export type Tone = "normal" | "muted" | "strong";

export interface ListRow {
  /** Left column text. */
  label: string;
  /** If set, the label is clickable and runs this command like typed input. */
  command?: string;
  /** Right column text (secondary). */
  detail?: string;
  /** If set, `detail` is shown as an external link to this URL. */
  href?: string;
}

export type Block =
  | { type: "text"; text: string; tone?: Tone; /** cap line length to ~80ch */ measure?: boolean }
  | { type: "error"; text: string }
  | { type: "list"; rows: ListRow[] }
  | { type: "json"; /** pretty-printed, one entry per line */ lines: string[] }
  | { type: "spacer" }
  | {
      type: "fastfetch";
      logo: { src: string; alt: string };
      heading: string;
      subheading: string;
      rows: { label: string; value: string }[];
    };

/**
 * Side effects. Run immediately inside the user's Enter/click handler (before
 * the reveal animation) so browsers still treat window.open as user-initiated.
 */
export type Action =
  | { type: "clear" }
  | { type: "open"; url: string }
  | { type: "download"; href: string; filename: string }
  | { type: "redirect"; url: string; /** wait before leaving so the message can be read */ delayMs?: number }
  | { type: "lofi"; op: "play" | "stop" };

/** What the engine may know about the outside world when a command runs. */
export interface ExecContext {
  audio: { playing: boolean; muted: boolean };
}

export interface ExecResult {
  blocks: Block[];
  actions: Action[];
}

/** One documented way to call a command. Drives `rosh -h`. */
export interface Usage {
  label: string;
  description: string;
  /** Exact text to run when clicked. Omit if the usage has a placeholder. */
  run?: string;
}

export interface Command {
  name: string;
  usages: Usage[];
  /** Return null when the arguments are not valid for this command. */
  run(args: string[], ctx: ExecContext): ExecResult | null;
}
