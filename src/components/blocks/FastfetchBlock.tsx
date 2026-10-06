import { Fragment } from "react";
import Reveal from "./Reveal";

/** Written out in full so Tailwind can see every class. */
// const PALETTE = [
//   "bg-neutral-50",
//   "bg-neutral-100",
//   "bg-neutral-200",
//   "bg-neutral-300",
//   "bg-neutral-400",
//   "bg-neutral-500",
//   "bg-neutral-600",
//   "bg-neutral-700",
//   "bg-neutral-800",
//   "bg-neutral-900",
// ];

/**
 * Logo (image, used as-is) on the left, details on the right.
 * Stacks on mobile. The strip of neutral swatches mirrors real fastfetch's colour row.
 */
export default function FastfetchBlock({
  logo,
  heading,
  subheading,
  rows,
  animate,
}: {
  logo: { src: string; alt: string };
  heading: string;
  subheading: string;
  rows: { label: string; value: string }[];
  animate: boolean;
}) {
  return (
    <Reveal animate={animate}>
      <div className="flex flex-col gap-5 py-2 sm:flex-row sm:gap-10">
        <img
          src={logo.src}
          alt={logo.alt}
          width={160}
          height={160}
          decoding="async"
          className="h-24 w-24 shrink-0 object-contain object-left sm:h-40 sm:w-40"
        />
        <div className="min-w-0">
          <div className="font-pixel text-2xl leading-tight text-neutral-50 sm:text-3xl">{heading}</div>
          <div className="text-neutral-400">{subheading}</div>
          <dl className="mt-3 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1">
            {rows.map((row) => (
              <Fragment key={row.label}>
                <dt className="text-neutral-50">{row.label}:</dt>
                <dd className="measure text-neutral-300 [overflow-wrap:anywhere]">{row.value}</dd>
              </Fragment>
            ))}
          </dl>
          {/* <div aria-hidden="true" className="mt-4 flex w-fit outline outline-1 outline-neutral-800">
            {PALETTE.map((color) => (
              <span key={color} className={`h-4 w-6 ${color}`} />
            ))}
          </div> */}
        </div>
      </div>
    </Reveal>
  );
}
