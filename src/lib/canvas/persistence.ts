export const CANVAS_PERSISTENCE_KEY = "anime-visual-tracker-canvas";

export function throttle<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    const remaining = ms - (Date.now() - lastRun);

    if (remaining <= 0) {
      lastRun = Date.now();
      fn(...args);
      return;
    }

    if (timeoutId === undefined) {
      timeoutId = setTimeout(() => {
        lastRun = Date.now();
        timeoutId = undefined;
        fn(...args);
      }, remaining);
    }
  };
}
