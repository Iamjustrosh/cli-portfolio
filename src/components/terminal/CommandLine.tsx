import PromptLabel from "./PromptLabel";

/** A command that has already run: static text, like scrollback in a real terminal. */
export default function CommandLine({ command }: { command: string }) {
  return (
    <div className="whitespace-pre-wrap text-neutral-50 [overflow-wrap:anywhere]">
      <PromptLabel />
      {command}
    </div>
  );
}
