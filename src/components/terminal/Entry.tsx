import { memo } from "react";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { unitCount } from "@/engine/blocks";
import type { EntryData } from "@/hooks/useTerminal";
import CommandLine from "./CommandLine";

/**
 * One command and its output. `visibleUnits` is Infinity once finished.
 * Memoised: finished entries never re-render while later output appears.
 */
const Entry = memo(function Entry({
  entry,
  visibleUnits,
  onRun,
}: {
  entry: EntryData;
  visibleUnits: number;
  onRun: (command: string) => void;
}) {
  const animate = Number.isFinite(visibleUnits);
  let offset = 0;

  return (
    <div className="flex flex-col gap-1">
      <CommandLine command={entry.command} />
      {entry.blocks.map((block, index) => {
        const units = unitCount(block);
        const visible = Math.max(0, Math.min(units, visibleUnits - offset));
        offset += units;
        if (visible === 0) return null;
        return (
          <BlockRenderer key={index} block={block} visible={visible} animate={animate} onRun={onRun} />
        );
      })}
    </div>
  );
});

export default Entry;
