import { useCallback, useEffect, useRef, type RefObject } from "react";

const NEAR_BOTTOM_PX = 48;

/**
 * Keeps a scroll container pinned to the bottom while its content grows
 * (typing, output reveal, on-screen keyboard resizing the viewport) —
 * unless the visitor has scrolled up to read, in which case it leaves them alone.
 * `pin()` forces it back to the bottom (call it when a command is submitted).
 */
export function useStickToBottom(
  scrollRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
) {
  const stick = useRef(true);

  const toBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [scrollRef]);

  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;

    const follow = () => {
      if (stick.current) toBottom();
    };
    const onScroll = () => {
      stick.current =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= NEAR_BOTTOM_PX;
    };

    const observer = new ResizeObserver(follow);
    observer.observe(content);
    observer.observe(scroller);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    follow();

    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [scrollRef, contentRef, toBottom]);

  const pin = useCallback(() => {
    stick.current = true;
    toBottom();
  }, [toBottom]);

  return { pin };
}
