import { fortunes } from "@/data/fortunes";
import type { Command } from "../types";
import { ok } from "./helpers";

/**
 * Small hidden commands: they work, but are left out of `rosh -h`
 * so visitors can find them by trying things. Remove `hidden` to list one.
 */

export const whoamiCommand: Command = {
  name: "whoami",
  hidden: true,
  usages: [{ label: "whoami", description: "who you are" }],
  run(args) {
    return args.length === 0 ? ok([{ type: "text", text: "guest" }]) : null;
  },
};

export const greetingCommand: Command = {
  name: "hi",
  aliases: ["hello", "hey"],
  hidden: true,
  usages: [{ label: "hi", description: "say hello" }],
  run() {
    return ok([{ type: "text", text: "hello, guest. type rosh -h to see what you can do." }]);
  },
};

export const cdCommand: Command = {
  name: "cd",
  hidden: true,
  usages: [{ label: "cd", description: "change directory" }],
  run() {
    return ok([{ type: "text", text: "everything is already here. try rosh -h" }]);
  },
};

export const pwdCommand: Command = {
  name: "pwd",
  hidden: true,
  usages: [{ label: "pwd", description: "where you are" }],
  run(args) {
    return args.length === 0 ? ok([{ type: "text", text: "/home/guest/portfolio" }]) : null;
  },
};

let lastFortune = -1;

export const fortuneCommand: Command = {
  name: "fortune",
  hidden: true,
  usages: [{ label: "fortune", description: "a random line" }],
  run(args) {
    if (args.length > 0 || fortunes.length === 0) return null;
    let index = Math.floor(Math.random() * fortunes.length);
    if (fortunes.length > 1 && index === lastFortune) index = (index + 1) % fortunes.length; // never the same line twice in a row
    lastFortune = index;
    return ok([{ type: "text", text: fortunes[index] }]);
  },
};
