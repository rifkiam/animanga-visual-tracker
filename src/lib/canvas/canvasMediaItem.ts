import type { Media } from "@/models/media";
import type {
  MalAnimeListEntry,
  MalMangaListEntry,
} from "@/models/malListExport";

export const DEFAULT_DISPLAY_WIDTH = 300;
export const PLACEHOLDER_IMAGE =
  "https://placehold.co/300x400/jpg?text=4:3";

export type CanvasMediaItem = {
  mal_id: number;
  title: string;
  rating: string;
  url: string;
  imageUrl: string;
};

export function mediaToCanvasItem(media: Media): CanvasMediaItem {
  return {
    mal_id: media.mal_id,
    title: media.title,
    rating: media.rating,
    url: media.url,
    imageUrl: media.images.jpg.image_url ?? PLACEHOLDER_IMAGE,
  };
}

export function malAnimeEntryToCanvasItem(
  entry: MalAnimeListEntry,
  imageUrl: string,
  url: string,
): CanvasMediaItem {
  return {
    mal_id: entry.series_animedb_id,
    title: entry.series_title,
    rating: entry.my_rated || String(entry.my_score || ""),
    url,
    imageUrl,
  };
}

export function malMangaEntryToCanvasItem(
  entry: MalMangaListEntry,
  imageUrl: string,
  url: string,
): CanvasMediaItem {
  return {
    mal_id: entry.manga_mangadb_id,
    title: entry.manga_title,
    rating: String(entry.my_score || ""),
    url,
    imageUrl,
  };
}
