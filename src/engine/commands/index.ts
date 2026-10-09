import type { Command } from "../types";
import { playCommand, stopCommand } from "./audio";
import { catCommand } from "./cat";
import { clearCommand } from "./clear";
import { exitCommand } from "./exit";
import { cdCommand, fortuneCommand, greetingCommand, pwdCommand, whoamiCommand } from "./extras";
import { fastfetchCommand } from "./fastfetch";
import { historyCommand } from "./history";
import { keyboardCommand } from "./keyboard";
import { lsCommand } from "./ls";
import { resume } from "./resume";
import { createRoshCommand } from "./rosh";
import { runCommand } from "./run";

/**
 * The order of this array is the order shown in `rosh -h`.
 * Commands marked `hidden` still work but are not listed there.
 */
const rest: Command[] = [
  lsCommand,
  catCommand,
  runCommand,
  fastfetchCommand,
  keyboardCommand,
  resume,
  playCommand,
  stopCommand,
  historyCommand,
  clearCommand,
  exitCommand,
  // hidden extras
  whoamiCommand,
  greetingCommand,
  cdCommand,
  pwdCommand,
  fortuneCommand,
];
const rosh: Command = createRoshCommand(() => commands);

export const commands: Command[] = [rosh, ...rest];

/** Every name and alias points at its command. A clash is a bug, so fail loudly. */
export const registry = new Map<string, Command>();
for (const command of commands) {
  for (const name of [command.name, ...(command.aliases ?? [])]) {
    if (registry.has(name)) throw new Error(`duplicate command name: ${name}`);
    registry.set(name, command);
  }
}
