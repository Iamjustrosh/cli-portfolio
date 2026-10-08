// Scans public/audio/keys for keyboard sound packs and writes
// src/data/keyboardPacks.generated.json, so `keyboard` lists exactly what is installed.
// Runs automatically before dev, build, test and typecheck. Needs only Node's built-ins.

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_PRESS = ["BACKSPACE", "ENTER", "SPACE"];
const REQUIRED_RELEASE = ["GENERIC", "BACKSPACE", "ENTER", "SPACE"];

const mp3s = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((file) => file.toLowerCase().endsWith(".mp3")) : [];
const has = (files, name) => files.includes(`${name}.mp3`);

/** Returns { packs, skipped } for a keys folder. Pure and testable. */
export function scanPacks(keysDir) {
  const packs = [];
  const skipped = [];
  if (!existsSync(keysDir)) return { packs, skipped };

  for (const name of readdirSync(keysDir).sort()) {
    const dir = join(keysDir, name);
    if (!statSync(dir).isDirectory()) continue;

    const press = mp3s(join(dir, "press"));
    const missing = REQUIRED_PRESS.filter((key) => !has(press, key)).map((key) => `press/${key}.mp3`);
    const generic = press
      .map((file) => /^GENERIC_R(\d+)\.mp3$/.exec(file))
      .filter(Boolean)
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map((match) => match[0].slice(0, -".mp3".length));
    if (generic.length === 0) missing.push("press/GENERIC_R0.mp3");

    if (missing.length > 0) {
      skipped.push({ name, missing });
      continue;
    }

    const release = mp3s(join(dir, "release"));
    packs.push({ name, generic, release: REQUIRED_RELEASE.every((key) => has(release, key)) });
  }
  return { packs, skipped };
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { packs, skipped } = scanPacks(join(root, "public/audio/keys"));
  const out = join(root, "src/data/keyboardPacks.generated.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(packs, null, 2)}\n`);

  const names = packs.map((pack) => pack.name).join(", ") || "none";
  console.log(`keyboard packs: ${names}`);
  for (const { name, missing } of skipped) {
    console.warn(`keyboard packs: skipped "${name}", missing ${missing.join(", ")}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
