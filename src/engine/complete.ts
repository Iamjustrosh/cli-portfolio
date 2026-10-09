import { projects } from "@/data/projects";
import { commands, registry } from "./commands";
import { execute } from "./execute";
import type { Block, ExecContext } from "./types";

/**
 * Tab completion. Pure: text in, suggestion out. Completes the command name,
 * then the single argument that every command takes at most.
 *
 * Hidden commands (easter eggs) are never offered, so Tab cannot give them away.
 */

export interface Completion {
  /** The whole input line after completing (unchanged when there is nothing more to add). */
  value: string;
  /** Everything that still matches. One entry means it was completed outright. */
  candidates: string[];
}

/** Names a visitor can complete: visible commands and their aliases, minus the `?` shortcut. */
function commandNames(): string[] {
  const names = new Set<string>();
  for (const command of commands) {
    if (command.hidden) continue;
    for (const name of [command.name, ...(command.aliases ?? [])]) if (name !== "?") names.add(name);
  }
  return [...names].sort();
}

/**
 * The labels of the list a bare command prints (`ls`, `cat`, `keyboard` each list
 * what they accept). Using the command's own output means a new directory, file or
 * keyboard pack is completable without touching this file.
 */
function listed(command: string, ctx: ExecContext): string[] {
  const rows = execute(command, ctx).blocks.flatMap((block: Block) => (block.type === "list" ? block.rows : []));
  return rows.map((row) => row.label);
}

/** What each command accepts as its argument. A command missing here takes none. */
const argumentSources = new Map<string, (ctx: ExecContext) => string[]>([
  ["ls", (ctx) => listed("ls", ctx)],
  ["cat", (ctx) => listed("cat", ctx)],
  ["keyboard", (ctx) => listed("keyboard", ctx)],
  ["run", () => projects.map((project) => project.slug)],
  ["rosh", () => ["-h", "--h", "--help"]],
]);

/** Longest shared start of all candidates, compared ignoring case, spelled like the first one. */
function commonPrefix(items: string[]): string {
  let length = items[0].length;
  for (const item of items) {
    let i = 0;
    while (i < length && i < item.length && item[i].toLowerCase() === items[0][i].toLowerCase()) i++;
    length = i;
  }
  return items[0].slice(0, length);
}

export function complete(input: string, ctx: ExecContext): Completion | null {
  if (!input.trim()) return null;

  const head = /^\s*/.exec(input)![0];
  const tokens = input.trim().split(/\s+/);
  const endsWithSpace = /\s$/.test(input);

  // What is being completed: the command (first word), or its argument (second word).
  let completing: "command" | "argument";
  let prefix: string;
  if (tokens.length === 1 && !endsWithSpace) {
    completing = "command";
    prefix = tokens[0];
  } else if (tokens.length === 1 || (tokens.length === 2 && !endsWithSpace)) {
    completing = "argument";
    prefix = tokens.length === 2 ? tokens[1] : "";
  } else {
    return null;
  }

  const starts = (candidate: string) => candidate.toLowerCase().startsWith(prefix.toLowerCase());
  let candidates: string[];
  let beforeToken: string; // everything in the input that stays as typed
  let hasArguments = false;

  if (completing === "command") {
    candidates = commandNames().filter(starts);
    beforeToken = head;
  } else {
    const command = registry.get(tokens[0].toLowerCase());
    if (!command || command.hidden) return null;
    const source = argumentSources.get(command.name);
    if (!source) return null;
    candidates = [...new Set(source(ctx))].filter(starts).sort();
    beforeToken = `${input.slice(0, input.length - prefix.length)}`;
  }
  if (candidates.length === 0) return null;

  if (candidates.length === 1) {
    if (completing === "command") hasArguments = argumentSources.has(registry.get(candidates[0])!.name);
    return { value: `${beforeToken}${candidates[0]}${hasArguments ? " " : ""}`, candidates };
  }

  const shared = commonPrefix(candidates);
  return { value: `${beforeToken}${shared.length > prefix.length ? shared : prefix}`, candidates };
}
