"use client";

import { isMediaShapeMeta } from "@/models/mediaShapeMeta";
import { track, useEditor, useValue } from "tldraw";

export const ShapeMediaTooltip = track(function ShapeMediaTooltip() {
  const editor = useEditor();

  const tooltip = useValue(
    "media-shape-tooltip",
    () => {
      const point = editor.inputs.getCurrentPagePoint();
      const shape = editor.getShapeAtPoint(point, {
        hitInside: true,
        margin: 8,
      });

      if (!shape || shape.type !== "image" || !isMediaShapeMeta(shape.meta)) {
        return null;
      }

      const screen = editor.pageToScreen(point);

      return {
        meta: shape.meta,
        x: screen.x,
        y: screen.y,
      };
    },
    [editor],
  );

  if (!tooltip) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-xs rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md"
      style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
    >
      <p className="font-semibold text-zinc-900">{tooltip.meta.title}</p>
      {tooltip.meta.rating && (
        <p className="text-zinc-500">Score: {tooltip.meta.rating}</p>
      )}
    </div>
  );
});
