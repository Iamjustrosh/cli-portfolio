/** `rosh@portfolio:~$` — only the `$` carries the accent colour. */
export default function PromptLabel() {
  return (
    <span className="select-none whitespace-pre text-neutral-50">
      rosh@portfolio:~<span className="text-accent">$</span>{" "}
    </span>
  );
}
