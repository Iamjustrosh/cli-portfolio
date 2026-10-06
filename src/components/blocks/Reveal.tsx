import type { ReactNode } from "react";
import { m } from "motion/react";

/**
 * Entrance for one revealed unit: a quick fade with a tiny upward move.
 * `animate=false` (finished entries, reduced motion) renders it instantly.
 * Only transform + opacity are animated.
 */
export default function Reveal({
  animate,
  className,
  children,
}: {
  animate: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <m.div
      className={className}
      initial={animate ? { opacity: 0, y: 3 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
