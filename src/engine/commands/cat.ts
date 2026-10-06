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

const files = new Map<string, () => Block[]>([
  ["experience.txt", experienceBlocks],
  ["stack.json", () => [{ type: "json", lines: JSON.stringify(stack, null, 2).split("\n") }]],
  [
    "connect.txt",
    () => [
      {
        type: "list",
        rows: links.map((link) => ({ label: link.label, detail: link.display, href: link.url })),
      },
    ],
  ],
  [
    "gears.txt",
    () => [
      {
        type: "list",
        rows: gears.map((group) => ({ label: group.category, detail: group.items.join(", ") })),
      },
    ],
  ],
]);

export const catCommand: Command = {
  name: "cat",
  usages: [
    { label: "cat <project>.txt", description: "read about a project" },
    { label: "cat experience.txt", description: "where I have worked", run: "cat experience.txt" },
    { label: "cat stack.json", description: "my tech stack", run: "cat stack.json" },
    { label: "cat connect.txt", description: "how to reach me", run: "cat connect.txt" },
    { label: "cat gears.txt", description: "tools and gear I use", run: "cat gears.txt" },
  ],
  run(args) {
    if (args.length === 0) return fail("cat: missing file name");
    if (args.length > 1) return fail("cat: too many arguments");
    const name = args[0];

    const build = files.get(name);
    if (build) return ok(build());

    if (name.endsWith(".txt")) {
      const blocks = projectBlocks(name.slice(0, -".txt".length));
      if (blocks) return ok(blocks);
    }
    return fail(`cat: ${name}: no such file`);
  },
};
