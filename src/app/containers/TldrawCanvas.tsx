"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import {
  Tldraw,
  createTLStore,
  getSnapshot,
  loadSnapshot,
  type Editor,
} from "tldraw";
import "tldraw/tldraw.css";
import { ShapeMediaTooltip } from "@/app/components/ShapeMediaTooltip";
import {
  CANVAS_PERSISTENCE_KEY,
  throttle,
} from "@/lib/canvas/persistence";

const tldrawComponents = {
  InFrontOfTheCanvas: ShapeMediaTooltip,
};

type LoadingState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; error: string };

type TldrawCanvasProps = {
  onMount?: (editor: Editor) => void;
  colorScheme?: "dark" | "light";
};

export default function TldrawCanvas({ onMount, colorScheme = "light" }: TldrawCanvasProps) {
  const store = useMemo(() => createTLStore(), []);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: "loading",
  });

  useLayoutEffect(() => {
    setLoadingState({ status: "loading" });

    const savedSnapshot = localStorage.getItem(CANVAS_PERSISTENCE_KEY);

    if (savedSnapshot) {
      try {
        loadSnapshot(store, JSON.parse(savedSnapshot));
        setLoadingState({ status: "ready" });
      } catch (error) {
        setLoadingState({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Failed to load saved canvas",
        });
      }
    } else {
      setLoadingState({ status: "ready" });
    }

    const persistSnapshot = throttle(() => {
      const snapshot = getSnapshot(store);
      localStorage.setItem(CANVAS_PERSISTENCE_KEY, JSON.stringify(snapshot));
    }, 500);

    const cleanupListener = store.listen(persistSnapshot);

    return () => {
      cleanupListener();
    };
  }, [store]);

  if (loadingState.status === "loading") {
    return (
      <div className="relative h-full w-full">
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-200 bg-white px-6 py-4 shadow-lg">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
            <p className="text-sm text-zinc-600">Loading saved canvas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingState.status === "error") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-red-600">
          Failed to load canvas: {loadingState.error}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Tldraw
        store={store}
        onMount={onMount}
        colorScheme={colorScheme}
        components={tldrawComponents}
      />
    </div>
  );
}
