import type { Block } from "@/engine/types";
import ErrorBlock from "./ErrorBlock";
import FastfetchBlock from "./FastfetchBlock";
import JsonBlock from "./JsonBlock";
import ListBlock from "./ListBlock";
import SpacerBlock from "./SpacerBlock";
import TextBlock from "./TextBlock";

/**
 * One renderer per block type. `visible` is how many of the block's units are
 * shown (rows for a list, lines for JSON, 1 for everything else).
 */
export default function BlockRenderer({
  block,
  visible,
  animate,
  onRun,
}: {
  block: Block;
  visible: number;
  animate: boolean;
  onRun: (command: string) => void;
}) {
  switch (block.type) {
    case "text":
      return <TextBlock text={block.text} tone={block.tone} measure={block.measure} animate={animate} />;
    case "error":
      return <ErrorBlock text={block.text} animate={animate} />;
    case "list":
      return <ListBlock rows={block.rows} visible={visible} animate={animate} onRun={onRun} />;
    case "json":
      return <JsonBlock lines={block.lines} visible={visible} animate={animate} />;
    case "spacer":
      return <SpacerBlock />;
    case "fastfetch":
      return (
        <FastfetchBlock
          logo={block.logo}
          heading={block.heading}
          subheading={block.subheading}
          rows={block.rows}
          animate={animate}
        />
      );
  }
}
