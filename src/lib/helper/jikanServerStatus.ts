import { useSyncExternalStore } from "react";
import { getServerStatus } from "@/lib/api/jikan";
import type { JikanServerStatus } from "@/models/apiResponse";
import { getCookie, setCookie } from "@/lib/helper/cookies";

export const JIKAN_SERVER_STATUS_COOKIE = "avt-jikan-server-status";

const POLL_MS = parseInt(
  process.env.NEXT_PUBLIC_JIKAN_STATUS_POLL_MS ?? "60000",
  10,
);

export type JikanServerStatusState = {
  isOnline: boolean;
  isChecking: boolean;
  lastCheckedAt: number | null;
  error: string | null;
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function readCachedStatus(): Pick<
  JikanServerStatusState,
  "isOnline" | "lastCheckedAt"
> | null {
  const cached = getCookie(JIKAN_SERVER_STATUS_COOKIE);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached) as {
      isOnline?: boolean;
      checkedAt?: number;
    };

    if (typeof parsed.isOnline !== "boolean") return null;

    return {
      isOnline: parsed.isOnline,
      lastCheckedAt:
        typeof parsed.checkedAt === "number" ? parsed.checkedAt : null,
    };
  } catch {
    return null;
  }
}

function createInitialState(): JikanServerStatusState {
  const cached = readCachedStatus();

  return {
    isOnline: cached?.isOnline ?? true,
    isChecking: false,
    lastCheckedAt: cached?.lastCheckedAt ?? null,
    error: null,
  };
}

let state: JikanServerStatusState = createInitialState();
let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;

function persistState(next: JikanServerStatusState) {
  setCookie(
    JIKAN_SERVER_STATUS_COOKIE,
    JSON.stringify({
      isOnline: next.isOnline,
      checkedAt: next.lastCheckedAt,
    }),
    60,
  );
}

function setState(partial: Partial<JikanServerStatusState>) {
  state = { ...state, ...partial };
  persistState(state);
  notifyListeners();
}

export function isJikanServerOnline(status: JikanServerStatus): boolean {
  return !status.myanimelist_heartbeat.down;
}

export async function refreshJikanServerStatus(): Promise<JikanServerStatusState> {
  setState({ isChecking: true, error: null });

  try {
    const status = await getServerStatus();
    const isOnline = isJikanServerOnline(status);

    setState({
      isOnline,
      isChecking: false,
      lastCheckedAt: Date.now(),
      error: isOnline ? null : "Search and import are disabled until the server is back online",
    });
  } catch {
    setState({
      isOnline: false,
      isChecking: false,
      lastCheckedAt: Date.now(),
      error: "Unable to reach Jikan API",
    });
  }

  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  subscriberCount++;

  if (subscriberCount === 1) {
    void refreshJikanServerStatus();
    pollIntervalId = setInterval(() => {
      void refreshJikanServerStatus();
    }, POLL_MS);
  }

  return () => {
    listeners.delete(listener);
    subscriberCount--;

    if (subscriberCount === 0 && pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  };
}

function getSnapshot(): JikanServerStatusState {
  return state;
}

const SERVER_SNAPSHOT: JikanServerStatusState = {
  isOnline: true,
  isChecking: false,
  lastCheckedAt: null,
  error: null,
};

function getServerSnapshot(): JikanServerStatusState {
  return SERVER_SNAPSHOT;
}

export function useJikanServerStatus() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}
