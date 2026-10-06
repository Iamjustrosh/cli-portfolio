import type { ReactNode } from "react";

/**
 * Shared width + padding for the status bar and the terminal text, so their
 * left and right edges always line up.
 * Mobile: full width. Large screens: capped at max-w-7xl and centered.
 */
export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
