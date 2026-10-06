import type { Command } from "../types";
import { playCommand, stopCommand } from "./audio";
import { catCommand } from "./cat";
import { clearCommand } from "./clear";
import { exitCommand } from "./exit";
import { fastfetchCommand } from "./fastfetch";
import { lsCommand } from "./ls";
import { createRoshCommand } from "./rosh";
import { runCommand } from "./run";

/**
 * The order of this array is the order shown in `rosh -h`.
 */
const rest: Command[] = [
  lsCommand,
  catCommand,
  runCommand,
  fastfetchCommand,
  playCommand,
  stopCommand,
  clearCommand,
  exitCommand,
];
const rosh: Command = createRoshCommand(() => commands);

export const commands: Command[] = [rosh, ...rest];

export const registry = new Map<string, Command>(commands.map((command) => [command.name, command]));
