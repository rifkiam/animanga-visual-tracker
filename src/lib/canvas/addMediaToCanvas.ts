import { AssetRecordType, type Editor, type TLAsset } from "tldraw";
import type { MediaShapeMeta } from "@/models/mediaShapeMeta";
import {
  DEFAULT_DISPLAY_WIDTH,
  PLACEHOLDER_IMAGE,
  type CanvasMediaItem,
} from "@/lib/canvas/canvasMediaItem";

export type AddMediaToCanvasOptions = {
  displayWidth?: number;
  /** Top-left corner of the shape in page coordinates. */
  position?: { x: number; y: number };
};

function loadImageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({ w: image.naturalWidth, h: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });
}

function findAssetByMalId(
  editor: Editor,
  malId: number,
): TLAsset | undefined {
  return editor.getAssets().find((asset) => {
    const meta = asset.meta as MediaShapeMeta | undefined;
    return meta?.malId === malId;
  });
}

function buildShapeMeta(item: CanvasMediaItem): MediaShapeMeta {
  return {
    title: item.title,
    rating: item.rating,
    malId: item.mal_id,
    url: item.url,
  };
}

export async function addMediaToCanvas(
  editor: Editor,
  item: CanvasMediaItem,
  options: AddMediaToCanvasOptions = {},
): Promise<{ displayWidth: number; displayHeight: number }> {
  const displayWidth = options.displayWidth ?? DEFAULT_DISPLAY_WIDTH;
  const imageUrl = item.imageUrl || PLACEHOLDER_IMAGE;

  let sourceWidth = displayWidth;
  let sourceHeight = 400;

  try {
    const size = await loadImageSize(imageUrl);
    sourceWidth = size.w;
    sourceHeight = size.h;
  } catch {
    // Fall back to default dimensions when the image cannot be loaded.
  }

  const displayHeight = (sourceHeight / sourceWidth) * displayWidth;
  const meta = buildShapeMeta(item);

  let x: number;
  let y: number;

  if (options.position) {
    x = options.position.x;
    y = options.position.y;
  } else {
    const center = editor.getViewportPageBounds().center;
    x = center.x - displayWidth / 2;
    y = center.y - displayHeight / 2;
  }

  const duplicateAsset = findAssetByMalId(editor, item.mal_id);
  let assetId: TLAsset["id"];

  if (duplicateAsset) {
    assetId = duplicateAsset.id;

    if (duplicateAsset.type === "image") {
      const props = duplicateAsset.props;

      if (
        props.src !== imageUrl ||
        props.w !== sourceWidth ||
        props.h !== sourceHeight
      ) {
        editor.updateAssets([
          {
            id: duplicateAsset.id,
            type: "image",
            props: {
              name: item.title,
              src: imageUrl,
              w: sourceWidth,
              h: sourceHeight,
            },
            meta: { ...duplicateAsset.meta, ...meta },
          },
        ]);
      }
    }
  } else {
    assetId = AssetRecordType.createId();

    const asset: TLAsset = {
      id: assetId,
      type: "image",
      typeName: "asset",
      props: {
        name: item.title,
        src: imageUrl,
        w: sourceWidth,
        h: sourceHeight,
        mimeType: "image/jpeg",
        isAnimated: false,
      },
      meta,
    };

    editor.createAssets([asset]);
  }

  editor.createShape({
    type: "image",
    x,
    y,
    meta,
    props: {
      assetId,
      w: displayWidth,
      h: displayHeight,
      altText: item.title,
    },
  });

  return { displayWidth, displayHeight };
}
