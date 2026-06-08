import { useEffect, useRef, type RefObject } from "react";

const HOLD_MS = 500;
const MOVE_THRESHOLD_PX = 12;

type UseTouchLongPressOptions = {
  targetRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  onLongPress: (x: number, y: number) => void;
  shouldIgnoreTarget?: (target: EventTarget | null) => boolean;
};

export function useTouchLongPress({
  targetRef,
  enabled = true,
  onLongPress,
  shouldIgnoreTarget,
}: UseTouchLongPressOptions) {
  const onLongPressRef = useRef(onLongPress);
  const shouldIgnoreRef = useRef(shouldIgnoreTarget);

  useEffect(() => {
    onLongPressRef.current = onLongPress;
  }, [onLongPress]);

  useEffect(() => {
    shouldIgnoreRef.current = shouldIgnoreTarget;
  }, [shouldIgnoreTarget]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !enabled) return;

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!isCoarsePointer && !("ontouchstart" in window)) return;

    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let startX = 0;
    let startY = 0;
    let activeTouchId: number | null = null;

    const clearHold = () => {
      if (holdTimer !== undefined) {
        clearTimeout(holdTimer);
        holdTimer = undefined;
      }
      activeTouchId = null;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        clearHold();
        return;
      }

      const touch = event.touches[0];
      if (shouldIgnoreRef.current?.(event.target)) {
        clearHold();
        return;
      }

      activeTouchId = touch.identifier;
      startX = touch.clientX;
      startY = touch.clientY;

      holdTimer = setTimeout(() => {
        holdTimer = undefined;
        activeTouchId = null;
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
        onLongPressRef.current(startX, startY);
      }, HOLD_MS);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (activeTouchId === null || holdTimer === undefined) return;

      const touch = Array.from(event.touches).find(
        (t) => t.identifier === activeTouchId,
      );
      if (!touch) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.hypot(dx, dy) > MOVE_THRESHOLD_PX) {
        clearHold();
      }
    };

    const handleTouchEnd = () => {
      clearHold();
    };

    target.addEventListener("touchstart", handleTouchStart, { passive: true });
    target.addEventListener("touchmove", handleTouchMove, { passive: true });
    target.addEventListener("touchend", handleTouchEnd);
    target.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      clearHold();
      target.removeEventListener("touchstart", handleTouchStart);
      target.removeEventListener("touchmove", handleTouchMove);
      target.removeEventListener("touchend", handleTouchEnd);
      target.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [targetRef, enabled]);
}
