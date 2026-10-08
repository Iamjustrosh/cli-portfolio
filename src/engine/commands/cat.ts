import { experience } from "@/data/experience";
import { gears } from "@/data/gears";
import { links } from "@/data/links";
import { projects } from "@/data/projects";
import { stack } from "@/data/stack";
import type { Block, Command } from "../types";
import { fail, ok } from "./helpers";

function experienceBlocks(): Block[] {
  return experience.flatMap((entry, index): Block[] => [
    ...(index > 0 ? [{ type: "spacer" } as const] : []),
    { type: "text", tone: "strong", text: `${entry.role}, ${entry.company}` },
    { type: "text", tone: "muted", text: entry.period },
    { type: "text", measure: true, text: entry.summary },
  ]);
}

function projectBlocks(slug: string): Block[] | null {
  const project = projects.find((item) => item.slug === slug);
  if (!project) return null;
  return [
    { type: "text", tone: "strong", text: project.name },
    { type: "text", tone: "muted", text: project.tagline },
    { type: "spacer" },
    { type: "text", measure: true, text: project.description },
    { type: "spacer" },
    {
      type: "list",
      rows: [{ label: `run ${project.slug}`, command: `run ${project.slug}`, detail: project.url }],
    },
  ];
}

interface FileDef {
  name: string;
  description: string;
  build: () => Block[];
}

const fileDefs: FileDef[] = [
  { name: "experience.txt", description: "where I have worked", build: experienceBlocks },
  {
    name: "stack.json",
    description: "my tech stack",
    build: () => [{ type: "json", lines: JSON.stringify(stack, null, 2).split("\n") }],
  },
  {
    name: "connect.txt",
    description: "how to reach me",
    build: () => [
      {
        type: "list",
        rows: links.map((link) => ({ label: link.label, detail: link.display, href: link.url })),
      },
    ],
  },
  {
    name: "gears.txt",
    description: "tools and gear I use",
    build:     () =>
      gears.flatMap((group, index): Block[] => [
        ...(index > 0 ? [{ type: "spacer" } as const] : []),
        { type: "text", tone: "strong", text: group.category.toUpperCase() },
        {
          type: "list",
          rows: group.items.map((item) => ({
            label: item.type,
            detail: item.details ? `${item.name} — ${item.details}` : item.name,
          })),
        },
      ]),
  },
];

const files = new Map(fileDefs.map((file) => [file.name, file]));

export const catCommand: Command = {
  name: "cat",
  usages: [
    { label: "cat <project>.txt", description: "read about a project" },
    ...fileDefs.map((file) => ({ label: `cat ${file.name}`, description: file.description, run: `cat ${file.name}` })),
  ],
  run(args) {
    if (args.length === 0) {
      // Bare `cat` shows what can be read, each one clickable.
      return ok([
        { type: "text", tone: "muted", text: "files:" },
        {
          type: "list",
          rows: [
            ...fileDefs.map((file) => ({
              label: file.name,
              command: `cat ${file.name}`,
              detail: file.description,
            })),
            ...projects.map((project) => ({
              label: `${project.slug}.txt`,
              command: `cat ${project.slug}.txt`,
              detail: project.tagline,
            })),
          ],
        },
      ]);
    }
    if (args.length > 1) return fail("cat: too many arguments");
    const name = args[0];

    const file = files.get(name);
    if (file) return ok(file.build());

    if (name.endsWith(".txt")) {
      const blocks = projectBlocks(name.slice(0, -".txt".length));
      if (blocks) return ok(blocks);
    }
    return fail(`cat: ${name}: no such file`);
  },
};
