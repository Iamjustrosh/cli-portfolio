import type { EntryData } from "@/hooks/useTerminal";
import Entry from "./Entry";

/** Past commands and their output. Only the last entry can still be revealing. */
export default function History({
  entries,
  revealed,
  onRun,
}: {
  entries: EntryData[];
  revealed: number;
  onRun: (command: string) => void;
}) {
  return (
    <>
      {entries.map((entry, index) => (
        <Entry
          key={entry.id}
          entry={entry}
          visibleUnits={index === entries.length - 1 ? revealed : Infinity}
          onRun={onRun}
        />
      ))}
    </>
  );
}
