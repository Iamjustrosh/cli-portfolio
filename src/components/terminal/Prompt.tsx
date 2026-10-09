import { useState, type KeyboardEvent, type MouseEvent, type RefObject } from "react";
import { useKeySound } from "@/hooks/useKeySound";
import type { Status } from "@/hooks/useTerminal";
import { isModifierKey } from "@/lib/utils";
import Cursor, { type CursorState } from "./Cursor";
import PromptLabel from "./PromptLabel";

interface PromptProps {
  input: string;
  status: Status;
  inputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: (raw: string) => void;
  onSkip: () => void;
  /** Up/down arrow: step through this session's commands. */
  onHistory: (direction: "up" | "down") => void;
  /** Tab: complete what is typed. */
  onComplete: () => void;
}

/** Larger than any input: puts the drawn cursor at the end of the text. */
const END = Number.MAX_SAFE_INTEGER;

/**
 * The active prompt line.
 * A real <input> sits invisibly on top of the line: it captures typing, paste
 * and the mobile keyboard. What the visitor SEES is drawn from the `input`
 * state with our own block cursor.
 */
export default function Prompt({
  input,
  status,
  inputRef,
  onInputChange,
  onSubmit,
  onSkip,
  onHistory,
  onComplete,
}: PromptProps) {
  const sound = useKeySound();
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);

  const idle = status === "idle";
  const position = status === "typing" ? input.length : Math.min(caret, input.length);
  const before = input.slice(0, position);
  const char = input[position] ?? " ";
  const after = input.slice(position + 1);

  const cursorState: CursorState = status === "typing" ? "solid" : focused ? "blink" : "hollow";

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    sound.keyDown(event); // every real key press, whether or not the terminal is busy
    if (!idle) {
      // Busy: any real key finishes the current typing/animation immediately.
      if (!isModifierKey(event.key)) {
        event.preventDefault();
        onSkip();
      }
      return;
    }
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit(input);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault(); // otherwise the caret would jump to the start or end of the line
      onHistory(event.key === "ArrowUp" ? "up" : "down");
      setCaret(END);
    } else if (
      event.key === "Tab" &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      input.trim() !== ""
    ) {
      // Only with text typed: with an empty prompt Tab keeps moving focus as usual, so
      // keyboard-only visitors can still reach the clickable commands and the sound toggle.
      event.preventDefault();
      onComplete();
      setCaret(END);
    }
  }

  // Always put the caret at the end when the line is clicked, so the hidden
  // input's own text layout never disagrees with what is drawn.
  function handleMouseDown(event: MouseEvent<HTMLInputElement>) {
    event.preventDefault();
    const field = event.currentTarget;
    field.focus({ preventScroll: true });
    field.setSelectionRange(field.value.length, field.value.length);
    setCaret(field.value.length);
  }

  return (
    <div className="relative">
      {/* What the visitor sees. Hidden from screen readers: the real input below is
          what they interact with, and this mirror must not be announced per keystroke. */}
      <div
        aria-hidden="true"
        className={`whitespace-pre-wrap text-neutral-50 [overflow-wrap:anywhere] ${
          status === "running" ? "opacity-0" : ""
        }`}
      >
        <PromptLabel />
        <span>{before}</span>
        <Cursor char={char} state={cursorState} />
        <span>{after}</span>
      </div>

      <input
        ref={inputRef}
        value={input}
        onChange={(event) => {
          sound.inputChange(input, event.target.value);
          if (!idle) return; // locked while output is showing
          onInputChange(event.target.value);
          setCaret(event.target.selectionStart ?? event.target.value.length);
        }}
        onSelect={(event) => setCaret(event.currentTarget.selectionStart ?? 0)}
        onKeyDown={handleKeyDown}
        onKeyUp={sound.keyUp}
        onMouseDown={handleMouseDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Terminal command input"
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="send"
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-base text-transparent caret-transparent opacity-0 outline-none"
      />
    </div>
  );
}
