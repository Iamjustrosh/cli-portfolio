import { config } from "@/data/config";
import { profile } from "@/data/profile";
import { ageFromBirthDate } from "@/lib/age";
import type { Command } from "../types";
import { ok } from "./helpers";

export const fastfetchCommand: Command = {
  name: "fastfetch",
  usages: [{ label: "fastfetch", description: "about me, at a glance", run: "fastfetch" }],
  run(args) {
    if (args.length > 0) return null;
    return ok([
      {
        type: "fastfetch",
        logo: config.logo,
        heading: profile.name,
        subheading: "rosh@portfolio",
        rows: [
          { label: "Age", value: `${ageFromBirthDate(profile.dateOfBirth)} years` },
          { label: "Location", value: profile.location },
          ...profile.extras,
          { label: "About", value: profile.summary },
        ],
      },
    ]);
  },
};
