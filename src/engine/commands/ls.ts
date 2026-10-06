import { books } from "@/data/books";
import { games } from "@/data/games";
import { projects } from "@/data/projects";
import type { Block, Command } from "../types";
import { fail, ok } from "./helpers";

const targets = new Map<string, () => Block[]>([
  [
    "projects",
    () => [
      {
        type: "list",
        rows: projects.map((project) => ({
          label: project.slug,
          command: `cat ${project.slug}.txt`,
          detail: project.tagline,
        })),
      },
    ],
  ],
  ["games", () => [{ type: "list", rows: games.map((game) => ({ label: game.title, detail: game.note })) }]],
  ["books", () => [{ type: "list", rows: books.map((book) => ({ label: book.title, detail: book.note })) }]],
]);

export const lsCommand: Command = {
  name: "ls",
  usages: [
    { label: "ls projects", description: "list my projects", run: "ls projects" },
    { label: "ls games", description: "games I like to play", run: "ls games" },
    { label: "ls books", description: "books I have read", run: "ls books" },
  ],
  run(args) {
    if (args.length === 0) return fail("ls: missing directory");
    if (args.length > 1) return fail("ls: too many arguments");
    const build = targets.get(args[0]);
    return build ? ok(build()) : fail(`ls: ${args[0]}: no such directory`);
  },
};
