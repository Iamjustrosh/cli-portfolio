export interface Project {
  /** Lowercase, kebab-case. This is what visitors type: `cat <slug>.txt`, `run <slug>`. */
  slug: string;
  name: string;
  /** One line, shown in `ls projects`. */
  tagline: string;
  /** Shown by `cat <slug>.txt`. Line breaks are kept. */
  description: string;
  url: string;
}

export interface ExperienceEntry {
  role: string;
  company: string;
  period: string;
  summary: string;
}

export interface Profile {
  name: string;
  /** YYYY-MM-DD. The age shown in fastfetch is calculated from this. */
  dateOfBirth: string;
  location: string;
  summary: string;
  /** Extra fastfetch rows, shown between Location and About. */
  extras: { label: string; value: string }[];
}

export interface LinkEntry {
  label: string;
  /** Text shown on screen. */
  display: string;
  url: string;
}

export interface TitledEntry {
  title: string;
  note?: string;
}

export type GearItem = {
  type: string;
  name: string;
  details?: string;
};

export type GearGroup = {
  category: "hardware" | "software" | "tools";
  items: GearItem[];
};
