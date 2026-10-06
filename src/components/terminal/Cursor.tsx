export type CursorState = "blink" | "solid" | "hollow";

/** The character under the caret, drawn as a block (see .terminal-cursor in index.css). */
export default function Cursor({ char, state }: { char: string; state: CursorState }) {
  return (
    <span aria-hidden="true" data-state={state} className="terminal-cursor">
      {char === " " ? "\u00a0" : char}
    </span>
  );
}
