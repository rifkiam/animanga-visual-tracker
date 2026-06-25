import { useCallback, useSyncExternalStore } from "react";
import { getCookie, setCookie } from "@/lib/helper/cookies";

export const COLOR_SCHEME_COOKIE = "avt-color-scheme";
const LEGACY_COLOR_SCHEME_COOKIE = "colorScheme";

export type ColorScheme = "dark" | "light";

const colorSchemeListeners = new Set<() => void>();

function notifyColorSchemeChange() {
  colorSchemeListeners.forEach((listener) => listener());
}

export function readColorScheme(): ColorScheme {
  const saved =
    getCookie(COLOR_SCHEME_COOKIE) ?? getCookie(LEGACY_COLOR_SCHEME_COOKIE);

  return saved === "dark" || saved === "light" ? saved : "light";
}

export function saveColorScheme(scheme: ColorScheme) {
  setCookie(COLOR_SCHEME_COOKIE, scheme, 60 * 60 * 24 * 365);
  notifyColorSchemeChange();
}

function subscribeToColorScheme(listener: () => void) {
  colorSchemeListeners.add(listener);
  return () => {
    colorSchemeListeners.delete(listener);
  };
}

function getColorSchemeSnapshot(): ColorScheme {
  return readColorScheme();
}

function getColorSchemeServerSnapshot(): ColorScheme {
  return "light";
}

export function useColorScheme() {
  const colorScheme = useSyncExternalStore(
    subscribeToColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeServerSnapshot,
  );

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    saveColorScheme(scheme);
  }, []);

  return [colorScheme, setColorScheme] as const;
}
