export type MediaShapeMeta = {
  title?: string;
  rating?: string;
  malId?: number;
  url?: string;
};

export function isMediaShapeMeta(meta: unknown): meta is MediaShapeMeta {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "title" in meta &&
    typeof (meta as MediaShapeMeta).title === "string"
  );
}
