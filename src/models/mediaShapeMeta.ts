export type MediaShapeMeta = {
  title?: string;
  rating?: string;
  malId?: number;
  url?: string;
};

export function isMediaShapeMeta(meta: unknown): meta is MediaShapeMeta & { malId: number } {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "malId" in meta &&
    typeof (meta as MediaShapeMeta).malId === "number" &&
    "title" in meta &&
    typeof (meta as MediaShapeMeta).title === "string"
  );
}
