import type { Editor } from "tldraw";
import { getAnimeById, getMangaById } from "@/lib/api/jikan";
import type { MalImportSuccess } from "@/lib/mal/parseMalListExport";
import type {
  MalAnimeListEntry,
  MalMangaListEntry,
} from "@/models/malListExport";
import { addMediaToCanvas } from "@/lib/canvas/addMediaToCanvas";
import {
  DEFAULT_DISPLAY_WIDTH,
  malAnimeEntryToCanvasItem,
  malMangaEntryToCanvasItem,
} from "@/lib/canvas/canvasMediaItem";

const GRID_COLS = 10;
const GRID_GAP = 24;
const JIKAN_REQUEST_DELAY_MS = parseInt(process.env.NEXT_PUBLIC_JIKAN_REQUEST_DELAY_MS ?? "1000");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function addMalImportToCanvas(
  editor: Editor,
  result: MalImportSuccess,
): Promise<{ added: number; failed: number }> {
  const center = editor.getViewportPageBounds().center;
  const gridWidth = GRID_COLS * (DEFAULT_DISPLAY_WIDTH + GRID_GAP) - GRID_GAP;
  const startX = center.x - gridWidth / 2;
  const startY = center.y - 200;

  let added = 0;
  let failed = 0;
  let rowHeight = DEFAULT_DISPLAY_WIDTH * (4 / 3);

  for (let i = 0; i < result.entries.length; i++) {
    if (i > 0) {
      await delay(JIKAN_REQUEST_DELAY_MS);
    }

    const entry = result.entries[i];
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);

    try {
      let canvasItem;

      if (result.type === "anime") {
        const animeEntry = entry as MalAnimeListEntry;
        const data = await getAnimeById(animeEntry.series_animedb_id);
        canvasItem = malAnimeEntryToCanvasItem(
          animeEntry,
          data.images.jpg.image_url,
          data.url,
        );
      } else {
        const mangaEntry = entry as MalMangaListEntry;
        const data = await getMangaById(mangaEntry.manga_mangadb_id);
        canvasItem = malMangaEntryToCanvasItem(
          mangaEntry,
          data.images.jpg.image_url,
          data.url,
        );
      }

      const { displayHeight } = await addMediaToCanvas(editor, canvasItem, {
        position: {
          x: startX + col * (DEFAULT_DISPLAY_WIDTH + GRID_GAP),
          y: startY + row * (rowHeight + GRID_GAP),
        },
      });

      rowHeight = Math.max(rowHeight, displayHeight);
      added++;
    } catch (error) {
      console.error(error);
      failed++;
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("rate limit")
      ) {
        break;
      }
    }
  }

  return { added, failed };
}
