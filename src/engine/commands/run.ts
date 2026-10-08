// import { config } from "@/data/config";
import { projects } from "@/data/projects";
import type { Command } from "../types";
import { fail, ok } from "./helpers";

export const runCommand: Command = {
  name: "run",
  usages: [
    { label: "run <project>", description: "open a project" },
    // { label: "run resume", description: "download my resume", run: "run resume" },
  ],
  run(args) {
    if (args.length === 0) return fail("run: missing target");
    if (args.length > 1) return fail("run: too many arguments");
    const target = args[0];

    // if (target === "resume") {
    //   return ok(
    //     [{ type: "text", tone: "muted", text: `downloading ${config.resume.filename}...` }],
    //     [{ type: "download", href: config.resume.href, filename: config.resume.filename }],
    //   );
    // }

    const project = projects.find((item) => item.slug === target);
    if (!project) return fail(`run: ${target}: not found`);
    return ok(
      [{ type: "text", tone: "muted", text: `opening ${project.name} in a new tab...` }],
      [{ type: "open", url: project.url }],
    );
  },
};
