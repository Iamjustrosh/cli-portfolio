/** Case-insensitive lookup that returns the pack exactly as it is named on disk. */
export function findPack<T extends { name: string }>(name: string | null | undefined, packs: T[]): T | undefined {
  if (!name) return undefined;
  const wanted = name.toLowerCase();
  return packs.find((pack) => pack.name.toLowerCase() === wanted);
}

/**
 * Which pack to use at startup: the visitor's saved choice if it is still
 * installed, else the configured default, else the first one, else none.
 */
export function resolvePack<T extends { name: string }>(
  saved: string | null | undefined,
  preferred: string,
  packs: T[],
): string | null {
  return (findPack(saved, packs) ?? findPack(preferred, packs) ?? packs[0])?.name ?? null;
}
