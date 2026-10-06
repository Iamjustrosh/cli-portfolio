import type { Tone } from "@/engine/types";
import Reveal from "./Reveal";

const TONE_CLASS: Record<Tone, string> = {
  normal: "text-neutral-200",
  muted: "text-neutral-400",
  strong: "text-neutral-50",
};

export default function TextBlock({
  text,
  tone = "normal",
  measure,
  animate,
}: {
  text: string;
  tone?: Tone;
  measure?: boolean;
  animate: boolean;
}) {
  return (
    <Reveal animate={animate}>
      <p
        className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${TONE_CLASS[tone]} ${measure ? "measure" : ""}`}
      >
        {text}
      </p>
    </Reveal>
  );
}
