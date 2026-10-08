import { books } from "@/data/books";
import { games } from "@/data/games";
import { projects } from "@/data/projects";
import { anime } from "@/data/anime";
import type { Block, Command } from "../types";
import { fail, ok } from "./helpers";

interface Directory {
  name: string;
  description: string;
  build: () => Block[];
}

const directories: Directory[] = [
  {
    name: "projects",
    description: "list my projects",
    build: () => [
      {
        type: "list",
        rows: projects.map((project) => ({
          label: project.slug,
          command: `cat ${project.slug}.txt`,
          detail: project.tagline,
        })),
      },
    ],
  },
  {
    name: "games",
    description: "games I like to play",
    build: () => [{ type: "list", rows: games.map((game) => ({ label: game.title, detail: game.note })) }],
  },
  {
    name: "books",
    description: "books I have read",
    build: () => [{ type: "list", rows: books.map((book) => ({ label: book.title, detail: book.note })) }],
  },
  { name: "anime", description: "anime I have watched", build: () => [{ type: "list", rows: anime.map((anime) => ({ label: anime.title, detail: anime.note })) }] },

];

const targets = new Map(directories.map((directory) => [directory.name, directory]));

export const lsCommand: Command = {
  name: "ls",
  usages: directories.map((directory) => ({
    label: `ls ${directory.name}`,
    description: directory.description,
    run: `ls ${directory.name}`,
  })),
  run(args) {
    if (args.length === 0) {
      // Bare `ls` shows what can be listed, each one clickable.
      return ok([
        { type: "text", tone: "muted", text: "directories:" },
        {
          type: "list",
          rows: directories.map((directory) => ({
            label: directory.name,
            command: `ls ${directory.name}`,
            detail: directory.description,
          })),
        },
      ]);
    }
    if (args.length > 1) return fail("ls: too many arguments");
    const directory = targets.get(args[0]);
    return directory ? ok(directory.build()) : fail(`ls: ${args[0]}: no such directory`);
  },
};
