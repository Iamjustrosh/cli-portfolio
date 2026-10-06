import { config } from "@/data/config";
import type { Command } from "../types";
import { ok } from "./helpers";

export const resume: Command = {
    name: "resume",
    usages: [
        { label: "resume", description: "download my resume", run: "resume" },
    ],
    run(args) {
        if (args.length > 0) return null;
        return ok(
            [{ type: "text", tone: "muted", text: `downloading ${config.resume.filename}...` }],
            [{ type: "download", href: config.resume.href, filename: config.resume.filename }],
        );
    },
};