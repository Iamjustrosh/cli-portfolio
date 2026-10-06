import Reveal from "./Reveal";

type Kind = "key" | "string" | "literal" | "punct";
interface Token {
  text: string;
  kind: Kind | "space";
}

const KIND_CLASS: Record<Kind | "space", string> = {
  key: "text-neutral-50",
  string: "text-neutral-300",
  literal: "text-neutral-300",
  punct: "text-neutral-400",
  space: "",
};

const LINE = /^(\s*)(?:("(?:[^"\\]|\\.)*")(\s*:\s*))?(.*)$/;
const STRING = /^("(?:[^"\\]|\\.)*")(.*)$/;
const BRACKETS = /^[[\]{},]+$/;

/** Split one pretty-printed JSON line into coloured pieces (neutral shades only). */
function tokenize(line: string): Token[] {
  const match = LINE.exec(line);
  if (!match) return [{ text: line, kind: "literal" }];
  const [, indent, key, colon, rest] = match;
  const tokens: Token[] = [];

  if (indent) tokens.push({ text: indent, kind: "space" });
  if (key) {
    tokens.push({ text: key, kind: "key" });
    tokens.push({ text: colon, kind: "punct" });
  }

  const str = STRING.exec(rest);
  if (str) {
    tokens.push({ text: str[1], kind: "string" });
    if (str[2]) tokens.push({ text: str[2], kind: "punct" });
  } else if (BRACKETS.test(rest)) {
    tokens.push({ text: rest, kind: "punct" });
  } else if (rest) {
    const comma = rest.endsWith(",");
    tokens.push({ text: comma ? rest.slice(0, -1) : rest, kind: "literal" });
    if (comma) tokens.push({ text: ",", kind: "punct" });
  }
  return tokens;
}

export default function JsonBlock({
  lines,
  visible,
  animate,
}: {
  lines: string[];
  visible: number;
  animate: boolean;
}) {
  return (
    <div>
      {lines.slice(0, visible).map((line, index) => (
        <Reveal key={index} animate={animate} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
          {tokenize(line).map((token, i) => (
            <span key={i} className={KIND_CLASS[token.kind]}>
              {token.text}
            </span>
          ))}
        </Reveal>
      ))}
    </div>
  );
}
