import { XMLParser } from "fast-xml-parser";
import {
  MalAnimeListExportDocument,
  MalAnimeListEntry,
  MalAnimePriority,
  MalMangaListEntry,
  MalMangaListExportDocument,
  MalMangaPriority,
  MalMyInfo,
  MalStatus,
  normalizeMalAnimeEntries,
  normalizeMalMangaEntries,
} from "@/models/malListExport";

export type MalListType = "anime" | "manga";

export type MalImportSuccess =
  | {
      type: "anime";
      data: MalAnimeListExportDocument;
      entries: MalAnimeListEntry[];
      myinfo: MalMyInfo;
    }
  | {
      type: "manga";
      data: MalMangaListExportDocument;
      entries: MalMangaListEntry[];
      myinfo: MalMyInfo;
    };

export type MalImportResult =
  | { ok: true; result: MalImportSuccess }
  | { ok: false; errors: string[] };

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  parseTagValue: true,
  isArray: (tagName) => tagName === "anime" || tagName === "manga",
});

const MAL_STATUSES = new Set<string>(Object.values(MalStatus));
const ANIME_PRIORITIES = new Set<string>(["LOW", "MEDIUM", "HIGH"]);
const MANGA_PRIORITIES = new Set<string>(["Low", "Medium", "High"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, field: string, errors: string[]): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  errors.push(`${field} must be a string`);
  return "";
}

function asNumber(value: unknown, field: string, errors: string[]): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  errors.push(`${field} must be a number`);
  return 0;
}

function validateMyInfo(raw: unknown, errors: string[]): MalMyInfo | null {
  if (!isRecord(raw)) {
    errors.push("myinfo is missing or invalid");
    return null;
  }

  return {
    user_id: asNumber(raw.user_id, "myinfo.user_id", errors),
    user_name: asString(raw.user_name, "myinfo.user_name", errors),
    user_export_type: asNumber(raw.user_export_type, "myinfo.user_export_type", errors),
    user_total_anime: asNumber(raw.user_total_anime, "myinfo.user_total_anime", errors),
    user_total_watching: asNumber(raw.user_total_watching, "myinfo.user_total_watching", errors),
    user_total_completed: asNumber(raw.user_total_completed, "myinfo.user_total_completed", errors),
    user_total_onhold: asNumber(raw.user_total_onhold, "myinfo.user_total_onhold", errors),
    user_total_dropped: asNumber(raw.user_total_dropped, "myinfo.user_total_dropped", errors),
    user_total_plantowatch: asNumber(
      raw.user_total_plantowatch,
      "myinfo.user_total_plantowatch",
      errors,
    ),
  };
}

function validateAnimeEntry(
  raw: unknown,
  index: number,
  errors: string[],
): MalAnimeListEntry | null {
  if (!isRecord(raw)) {
    errors.push(`anime[${index}] is invalid`);
    return null;
  }

  const prefix = `anime[${index}]`;
  const status = asString(raw.my_status, `${prefix}.my_status`, errors);
  if (status && !MAL_STATUSES.has(status)) {
    errors.push(`${prefix}.my_status has invalid value "${status}"`);
  }

  const priority = asString(raw.my_priority, `${prefix}.my_priority`, errors);
  if (priority && !ANIME_PRIORITIES.has(priority)) {
    errors.push(`${prefix}.my_priority has invalid value "${priority}"`);
  }

  return {
    series_animedb_id: asNumber(raw.series_animedb_id, `${prefix}.series_animedb_id`, errors),
    series_title: asString(raw.series_title, `${prefix}.series_title`, errors),
    series_type: asString(raw.series_type, `${prefix}.series_type`, errors),
    series_episodes: asNumber(raw.series_episodes, `${prefix}.series_episodes`, errors),
    my_id: asNumber(raw.my_id, `${prefix}.my_id`, errors),
    my_watched_episodes: asNumber(
      raw.my_watched_episodes,
      `${prefix}.my_watched_episodes`,
      errors,
    ),
    my_start_date: asString(raw.my_start_date, `${prefix}.my_start_date`, errors),
    my_finish_date: asString(raw.my_finish_date, `${prefix}.my_finish_date`, errors),
    my_rated: asString(raw.my_rated, `${prefix}.my_rated`, errors),
    my_score: asNumber(raw.my_score, `${prefix}.my_score`, errors),
    my_storage: asString(raw.my_storage, `${prefix}.my_storage`, errors),
    my_storage_value: asNumber(raw.my_storage_value, `${prefix}.my_storage_value`, errors),
    my_status: status as MalStatus,
    my_comments: asString(raw.my_comments, `${prefix}.my_comments`, errors),
    my_times_watched: asNumber(raw.my_times_watched, `${prefix}.my_times_watched`, errors),
    my_rewatch_value: asString(raw.my_rewatch_value, `${prefix}.my_rewatch_value`, errors),
    my_priority: priority as MalAnimePriority,
    my_tags: asString(raw.my_tags, `${prefix}.my_tags`, errors),
    my_rewatching: asNumber(raw.my_rewatching, `${prefix}.my_rewatching`, errors),
    my_rewatching_ep: asNumber(raw.my_rewatching_ep, `${prefix}.my_rewatching_ep`, errors),
    my_discuss: asNumber(raw.my_discuss, `${prefix}.my_discuss`, errors),
    my_sns: asString(raw.my_sns, `${prefix}.my_sns`, errors),
    update_on_import: asNumber(raw.update_on_import, `${prefix}.update_on_import`, errors),
  };
}

function validateMangaEntry(
  raw: unknown,
  index: number,
  errors: string[],
): MalMangaListEntry | null {
  if (!isRecord(raw)) {
    errors.push(`manga[${index}] is invalid`);
    return null;
  }

  const prefix = `manga[${index}]`;
  const status = asString(raw.my_status, `${prefix}.my_status`, errors);
  if (status && !MAL_STATUSES.has(status)) {
    errors.push(`${prefix}.my_status has invalid value "${status}"`);
  }

  const priority = asString(raw.my_priority, `${prefix}.my_priority`, errors);
  if (priority && !MANGA_PRIORITIES.has(priority)) {
    errors.push(`${prefix}.my_priority has invalid value "${priority}"`);
  }

  const rereading = asString(raw.my_rereading, `${prefix}.my_rereading`, errors);
  if (rereading && rereading !== "NO" && rereading !== "YES") {
    errors.push(`${prefix}.my_rereading must be "NO" or "YES"`);
  }

  const discuss = asString(raw.my_discuss, `${prefix}.my_discuss`, errors);
  if (discuss && discuss !== "NO" && discuss !== "YES") {
    errors.push(`${prefix}.my_discuss must be "NO" or "YES"`);
  }

  return {
    manga_mangadb_id: asNumber(raw.manga_mangadb_id, `${prefix}.manga_mangadb_id`, errors),
    manga_title: asString(raw.manga_title, `${prefix}.manga_title`, errors),
    manga_volumes: asNumber(raw.manga_volumes, `${prefix}.manga_volumes`, errors),
    manga_chapters: asNumber(raw.manga_chapters, `${prefix}.manga_chapters`, errors),
    my_id: asNumber(raw.my_id, `${prefix}.my_id`, errors),
    my_read_volumes: asNumber(raw.my_read_volumes, `${prefix}.my_read_volumes`, errors),
    my_read_chapters: asNumber(raw.my_read_chapters, `${prefix}.my_read_chapters`, errors),
    my_start_date: asString(raw.my_start_date, `${prefix}.my_start_date`, errors),
    my_finish_date: asString(raw.my_finish_date, `${prefix}.my_finish_date`, errors),
    my_scanalation_group: asString(
      raw.my_scanalation_group,
      `${prefix}.my_scanalation_group`,
      errors,
    ),
    my_score: asNumber(raw.my_score, `${prefix}.my_score`, errors),
    my_storage: asString(raw.my_storage, `${prefix}.my_storage`, errors),
    my_retail_volumes: asNumber(raw.my_retail_volumes, `${prefix}.my_retail_volumes`, errors),
    my_status: status as MalStatus,
    my_comments: asString(raw.my_comments, `${prefix}.my_comments`, errors),
    my_times_read: asNumber(raw.my_times_read, `${prefix}.my_times_read`, errors),
    my_tags: asString(raw.my_tags, `${prefix}.my_tags`, errors),
    my_priority: priority as MalMangaPriority,
    my_reread_value: asString(raw.my_reread_value, `${prefix}.my_reread_value`, errors),
    my_rereading: rereading as "NO" | "YES",
    my_discuss: discuss as "NO" | "YES",
    my_sns: asString(raw.my_sns, `${prefix}.my_sns`, errors),
    update_on_import: asNumber(raw.update_on_import, `${prefix}.update_on_import`, errors),
  };
}

export function parseMalListExport(
  xml: string,
  expectedType: MalListType,
): MalImportResult {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = xmlParser.parse(xml);
  } catch {
    return { ok: false, errors: ["Invalid XML file"] };
  }

  if (!isRecord(parsed) || !isRecord(parsed.myanimelist)) {
    return { ok: false, errors: ["Root element <myanimelist> is missing"] };
  }

  const root = parsed.myanimelist;
  const myinfo = validateMyInfo(root.myinfo, errors);

  const hasAnime = root.anime !== undefined;
  const hasManga = root.manga !== undefined;

  if (expectedType === "anime") {
    if (!hasAnime) {
      errors.push("Expected an anime list but no <anime> entries were found");
    }
    if (hasManga) {
      errors.push("File contains <manga> entries but anime list type was selected");
    }

    const rawEntries = Array.isArray(root.anime)
      ? root.anime
      : root.anime
        ? [root.anime]
        : [];

    const entries = rawEntries
      .map((entry, index) => validateAnimeEntry(entry, index, errors))
      .filter((entry): entry is MalAnimeListEntry => entry !== null);

    if (entries.length === 0 && hasAnime) {
      errors.push("No valid anime entries found");
    }

    if (errors.length > 0 || !myinfo) {
      return { ok: false, errors };
    }

    const data: MalAnimeListExportDocument = {
      myanimelist: {
        myinfo,
        anime: entries.length === 1 ? entries[0] : entries,
      },
    };

    return {
      ok: true,
      result: {
        type: "anime",
        data,
        entries: normalizeMalAnimeEntries(data.myanimelist.anime),
        myinfo,
      },
    };
  }

  if (!hasManga) {
    errors.push("Expected a manga list but no <manga> entries were found");
  }
  if (hasAnime) {
    errors.push("File contains <anime> entries but manga list type was selected");
  }

  const rawEntries = Array.isArray(root.manga)
    ? root.manga
    : root.manga
      ? [root.manga]
      : [];

  const entries = rawEntries
    .map((entry, index) => validateMangaEntry(entry, index, errors))
    .filter((entry): entry is MalMangaListEntry => entry !== null);

  if (entries.length === 0 && hasManga) {
    errors.push("No valid manga entries found");
  }

  if (errors.length > 0 || !myinfo) {
    return { ok: false, errors };
  }

  const data: MalMangaListExportDocument = {
    myanimelist: {
      myinfo,
      manga: entries.length === 1 ? entries[0] : entries,
    },
  };

  return {
    ok: true,
    result: {
      type: "manga",
      data,
      entries: normalizeMalMangaEntries(data.myanimelist.manga),
      myinfo,
    },
  };
}
