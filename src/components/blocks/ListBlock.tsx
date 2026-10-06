import type { CSSProperties } from "react";
import type { ListRow } from "@/engine/types";
import Reveal from "./Reveal";

/**
 * Two columns on sm+ (label, detail), stacked on mobile.
 * The label column width is fixed from the longest label (monospace `ch`), so
 * columns never jitter while rows appear one by one.
 */
export default function ListBlock({
  rows,
  visible,
  animate,
  onRun,
}: {
  rows: ListRow[];
  visible: number;
  animate: boolean;
  onRun: (command: string) => void;
}) {
  const labelWidth = Math.max(...rows.map((row) => row.label.length));

  return (
    <div
      className="flex flex-col gap-2 sm:gap-1"
      style={{ "--label-w": `${labelWidth}ch` } as CSSProperties}
    >
      {rows.slice(0, visible).map((row, index) => (
        <Reveal key={index} animate={animate} className="flex flex-col sm:flex-row sm:gap-6">
          <span className="sm:w-[var(--label-w)] sm:shrink-0">
            {row.command ? (
              <button
                type="button"
                onClick={() => onRun(row.command!)}
                className="min-h-6 w-fit text-left text-neutral-300 underline decoration-neutral-600 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
              >
                {row.label}
              </button>
            ) : (
              <span className="text-neutral-300">{row.label}</span>
            )}
          </span>
          {row.detail && row.href ? (
            <a
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-6 w-fit text-neutral-300 underline decoration-neutral-600 underline-offset-4 transition-colors [overflow-wrap:anywhere] hover:text-accent hover:decoration-accent"
            >
              {row.detail}
            </a>
          ) : row.detail ? (
            <span className="text-neutral-400 [overflow-wrap:anywhere]">{row.detail}</span>
          ) : null}
        </Reveal>
      ))}
    </div>
  );
}
