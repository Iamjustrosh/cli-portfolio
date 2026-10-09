import { useCallback, useEffect, useRef } from "react";
import Container from "@/components/layout/Container";
import { useStickToBottom } from "@/hooks/useStickToBottom";
import { useTerminal } from "@/hooks/useTerminal";
import History from "./History";
import Prompt from "./Prompt";

/**
 * Full-screen scroll area: history on top, the live prompt always last.
 * Everything is one continuous column, like a real terminal.
 */
export default function Terminal() {
  const { entries, input, setInput, status, revealed, submit, runCommand, skip, recall, complete } = useTerminal();

  const scrollRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { pin } = useStickToBottom(scrollRef, contentRef);

  const handleSubmit = useCallback(
    (raw: string) => {
      pin();
      submit(raw);
    },
    [pin, submit],
  );

  // Clicking a command in the output types it and runs it, same as typing.
  const handleRun = useCallback(
    (command: string) => {
      pin();
      runCommand(command);
    },
    [pin, runCommand],
  );

  // Whenever the terminal is ready for input again, put the cursor back.
  useEffect(() => {
    if (status === "idle") inputRef.current?.focus({ preventScroll: true });
  }, [status]);

  function handleClick() {
    if (status !== "idle") {
      skip(); // tapping while output is showing finishes it (touch equivalent of "any key")
      return;
    }
    if (window.getSelection()?.toString()) return; // don't steal focus while selecting text
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <main
      ref={scrollRef}
      onClick={handleClick}
      className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
    >
      <Container className="py-4 text-sm leading-relaxed sm:text-[15px] sm:leading-relaxed">
        <div ref={contentRef} role="log" aria-live="polite" className="flex flex-col gap-3 pb-6">
          <History entries={entries} revealed={revealed} onRun={handleRun} />
          <Prompt
            input={input}
            status={status}
            inputRef={inputRef}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onSkip={skip}
            onHistory={recall}
            onComplete={complete}
          />
        </div>
      </Container>
    </main>
  );
}
