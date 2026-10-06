import type { Command, ExecResult, ListRow } from "../types";

const HELP_FLAGS = new Set(["-h", "--h", "--help"]);

/**
 * `rosh -h` is generated from every command's own documented usages, so help
 * can never drift out of date. It receives the command list lazily to avoid a
 * circular import with commands/index.ts.
 */
export function createRoshCommand(getCommands: () => Command[]): Command {
  return {
    name: "rosh",
    usages: [
      { label: "rosh -h", description: "show this list (also --h, --help)", run: "rosh -h" },
    ],
    run(args) {
      const wantsHelp = args.length === 0 || (args.length === 1 && HELP_FLAGS.has(args[0]));
      return wantsHelp ? help(getCommands()) : null;
    },
  };
}

function help(commands: Command[]): ExecResult {
  const rows: ListRow[] = commands
    .flatMap((command) => command.usages)
    .map((usage) => ({ label: usage.label, command: usage.run, detail: usage.description }));

  return {
    blocks: [
      { type: "text", tone: "muted", text: "type a command, or click one:" },
      { type: "list", rows },
    ],
    actions: [],
  };
}
