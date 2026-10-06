import type { Block } from "./types";

/**
 * A "unit" is the smallest piece revealed one at a time:
 * a list reveals one row per unit, JSON one line per unit, everything else is one unit.
 */
export function unitCount(block: Block): number {
  switch (block.type) {
    case "list":
      return block.rows.length;
    case "json":
      return block.lines.length;
    default:
      return 1;
  }
}

export function unitTotal(blocks: Block[]): number {
  return blocks.reduce((sum, block) => sum + unitCount(block), 0);
}
