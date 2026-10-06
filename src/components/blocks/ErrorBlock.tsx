import Reveal from "./Reveal";

export default function ErrorBlock({ text, animate }: { text: string; animate: boolean }) {
  return (
    <Reveal animate={animate}>
      <p className="whitespace-pre-wrap text-danger [overflow-wrap:anywhere]">{text}</p>
    </Reveal>
  );
}
