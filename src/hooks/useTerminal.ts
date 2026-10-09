import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { complete } from "@/engine/complete";
import { execute } from "@/engine/execute";
import { unitTotal } from "@/engine/blocks";
import type { Block } from "@/engine/types";
import { performAction } from "@/services/actions";
import { getAudioState } from "@/services/audioStore";
import { trackCommand } from "@/services/analytics";
import { getActivePack } from "@/services/keySound";
import { addToHistory, NOT_BROWSING, stepHistory, type Browse } from "@/lib/history";
import { rand } from "@/lib/utils";

/**
 * idle    - waiting for the visitor to type
 * typing  - a scripted command is being typed into the prompt (auto-run / click)
 * running - output is being revealed; the prompt is hidden and input is locked
 */
export type Status = "idle" | "typing" | "running";

export interface EntryData {
  id: number;
  command: string;
  blocks: Block[];
}

const BOOT_COMMAND = "rosh --help";
const BOOT_DELAY = 450;
const FIRST_UNIT_DELAY = 70;
const UNIT_DELAY = 34;
const TYPE_START_DELAY = 140;
const PRE_SUBMIT_PAUSE = 260;

export function useTerminal() {
  const reducedMotion = useReducedMotion();

  const [entries, setEntries] = useState<EntryData[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatusState] = useState<Status>("idle");
  /** How many units of the LAST entry are visible. Infinity = all (finished). */
  const [revealed, setRevealed] = useState<number>(Infinity);

  const statusRef = useRef<Status>("idle");
  const inputRef = useRef("");
  const entryIdRef = useRef(0);
  const entryCountRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  /** Finishes whatever is in progress instantly (typing or reveal). */
  const skipRef = useRef<(() => void) | null>(null);
  const reducedRef = useRef(false);
  /** Commands the visitor ran this session (for the up/down arrows and `history`). */
  const historyRef = useRef<string[]>([]);
  /** Where up/down currently is in that history. */
  const browseRef = useRef<Browse>(NOT_BROWSING);
  /** The input as it was after a Tab that could not narrow it down: a second Tab on it lists the options. */
  const tabRef = useRef<string | null>(null);

  useEffect(() => {
    reducedRef.current = !!reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const setStatus = useCallback((next: Status) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const clearTimer = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }, []);

  /** Run a command: freeze the line, execute, run actions, reveal output. */
  const submit = useCallback(
    (raw: string, fromVisitor = true) => {
      if (statusRef.current === "running") return;
      clearTimer();
      skipRef.current = null;
      setInput("");
      browseRef.current = NOT_BROWSING;
      tabRef.current = null;

      // The automatic intro is not the visitor's command: not in history, not in analytics.
      if (fromVisitor) historyRef.current = addToHistory(historyRef.current, raw);
      const result = execute(raw, {
        audio: getAudioState(),
        keyboard: { pack: getActivePack() },
        history: historyRef.current,
      });
      if (fromVisitor) trackCommand(raw);

      let cleared = false;
      for (const action of result.actions) {
        if (action.type === "clear") cleared = true;
        else performAction(action); // immediately, while still a user gesture
      }

      if (cleared) {
        entryCountRef.current = 0;
        setEntries([]);
        setRevealed(Infinity);
        setStatus("idle");
        return;
      }

      const entry: EntryData = { id: ++entryIdRef.current, command: raw, blocks: result.blocks };
      entryCountRef.current += 1;
      setEntries((prev) => [...prev, entry]);

      const total = unitTotal(entry.blocks);
      if (total === 0 || reducedRef.current) {
        setRevealed(Infinity);
        setStatus("idle");
        return;
      }

      setRevealed(0);
      setStatus("running");

      let shown = 0;
      const finish = () => {
        clearTimer();
        skipRef.current = null;
        setRevealed(Infinity);
        setStatus("idle");
      };
      skipRef.current = finish;

      const tick = () => {
        shown += 1;
        if (shown >= total) {
          finish();
          return;
        }
        setRevealed(shown);
        timerRef.current = window.setTimeout(tick, UNIT_DELAY);
      };
      timerRef.current = window.setTimeout(tick, FIRST_UNIT_DELAY);
    },
    [clearTimer, setStatus],
  );

  /** Type a command into the prompt by itself (silently), then submit it. `silent` keeps it out of analytics (the boot command). */
  const runCommand = useCallback(
    (text: string, silent = false) => {
      if (statusRef.current !== "idle") return;
      setStatus("typing");
      setInput("");

      const finish = () => {
        clearTimer();
        skipRef.current = null;
        submit(text, !silent);
      };
      skipRef.current = finish;

      if (reducedRef.current) {
        setInput(text);
        timerRef.current = window.setTimeout(finish, 180);
        return;
      }

      let typed = 0;
      const typeNext = () => {
        typed += 1;
        setInput(text.slice(0, typed));
        if (typed >= text.length) {
          timerRef.current = window.setTimeout(finish, PRE_SUBMIT_PAUSE);
          return;
        }
        timerRef.current = window.setTimeout(typeNext, rand(28, 62));
      };
      timerRef.current = window.setTimeout(typeNext, TYPE_START_DELAY);
    },
    [clearTimer, setStatus, submit],
  );

  /** What the visitor types goes through here: it also ends any up/down browsing and any half-finished Tab. */
  const typeInput = useCallback((value: string) => {
    browseRef.current = NOT_BROWSING;
    tabRef.current = null;
    setInput(value);
  }, []);

  /** Up/down arrow: walk through this session's commands. */
  const recall = useCallback((direction: "up" | "down") => {
    if (statusRef.current !== "idle") return;
    const step = stepHistory(historyRef.current, browseRef.current, direction, inputRef.current);
    if (!step) return;
    browseRef.current = step.browse;
    tabRef.current = null;
    setInput(step.value);
  }, []);

  /**
   * Tab: complete the command or its argument. When several options remain and the
   * text cannot grow any further, a second Tab prints them under the prompt (the
   * prompt keeps what was typed), like a real shell.
   */
  const completeInput = useCallback(() => {
    if (statusRef.current !== "idle") return;
    const current = inputRef.current;
    const result = complete(current, {
      audio: getAudioState(),
      keyboard: { pack: getActivePack() },
      history: historyRef.current,
    });
    if (!result) return;

    browseRef.current = NOT_BROWSING;
    if (result.candidates.length === 1) {
      tabRef.current = null;
      setInput(result.value);
    } else if (result.value !== current) {
      tabRef.current = result.value; // grew a little: one more Tab lists what is left
      setInput(result.value);
    } else if (tabRef.current === current) {
      const options: EntryData = {
        id: ++entryIdRef.current,
        command: current,
        blocks: [{ type: "text", text: result.candidates.join("  ") }],
      };
      setEntries((prev) => [...prev, options]);
      setRevealed(Infinity);
    } else {
      tabRef.current = current;
    }
  }, []);

  /** Any key while busy: finish the current typing/reveal immediately. */
  const skip = useCallback(() => {
    skipRef.current?.();
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    skipRef.current = null;
    setInput("");
    setRevealed(Infinity);
    setStatus("idle");
  }, [clearTimer, setStatus]);

  // Boot: once the fonts are ready, type and run `rosh --help` by itself.
  // Fully cancellable, so React Strict Mode's double effect run is harmless.
  useEffect(() => {
    if (entryCountRef.current > 0) return; // e.g. hot reload: don't repeat the intro
    let cancelled = false;

    const start = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        /* fonts API unavailable: just go ahead */
      }
      if (cancelled) return;
      timerRef.current = window.setTimeout(() => {
        const userAlreadyActed = entryCountRef.current > 0 || inputRef.current !== "";
        if (!cancelled && !userAlreadyActed) runCommand(BOOT_COMMAND, true);
      }, BOOT_DELAY);
    };
    void start();

    return () => {
      cancelled = true;
      reset();
    };
  }, [runCommand, reset]);

  return {
    entries,
    input,
    setInput: typeInput,
    status,
    revealed,
    submit,
    runCommand,
    skip,
    recall,
    complete: completeInput,
  };
}
