/*
Global types
*/

export interface MalMyInfo {
    user_id: number;
    user_name: string;
    user_export_type: number;
    user_total_anime: number;
    user_total_watching: number;
    user_total_completed: number;
    user_total_onhold: number;
    user_total_dropped: number;
    user_total_plantowatch: number;
}

export enum MalStatus {
    Watching = "Watching",
    Reading = "Reading",
    Completed = "Completed",
    OnHold = "On-Hold",
    Dropped = "Dropped",
    PlanToWatch = "Plan to Watch",
    PlanToRead = "Plan to Read",
}


/** Parsed MAL list XML root (e.g. from fast-xml-parser). */
export interface MalAnimeListExportDocument {
    myanimelist: MalAnimeList;
}

export interface MalAnimeList {
    myinfo: MalMyInfo;
    /** Single entry when the export has one anime; array otherwise. */
    anime: MalAnimeListEntry | MalAnimeListEntry[];
}

export type MalAnimePriority = "LOW" | "MEDIUM" | "HIGH";

export interface MalAnimeListEntry {
    series_animedb_id: number;
    series_title: string;
    series_type: string;
    series_episodes: number;
    my_id: number;
    my_watched_episodes: number;
    my_start_date: string;
    my_finish_date: string;
    my_rated: string;
    my_score: number;
    my_storage: string;
    my_storage_value: number;
    my_status: MalStatus;
    my_comments: string;
    my_times_watched: number;
    my_rewatch_value: string;
    my_priority: MalAnimePriority;
    my_tags: string;
    my_rewatching: number;
    my_rewatching_ep: number;
    my_discuss: number;
    my_sns: string;
    update_on_import: number;
}

export function normalizeMalAnimeEntries(
    anime: MalAnimeList["anime"],
): MalAnimeListEntry[] {
    return Array.isArray(anime) ? anime : [anime];
}


/** Parsed MAL manga list XML root (e.g. from fast-xml-parser). */
export interface MalMangaListExportDocument {
    myanimelist: MalMangaList;
}

export interface MalMangaList {
    myinfo: MalMyInfo;
    /** Single entry when the export has one manga; array otherwise. */
    manga: MalMangaListEntry | MalMangaListEntry[];
}

export type MalMangaPriority = "Low" | "Medium" | "High";

export interface MalMangaListEntry {
    manga_mangadb_id: number;
    manga_title: string;
    manga_volumes: number;
    manga_chapters: number;
    my_id: number;
    my_read_volumes: number;
    my_read_chapters: number;
    my_start_date: string;
    my_finish_date: string;
    my_scanalation_group: string;
    my_score: number;
    my_storage: string;
    my_retail_volumes: number;
    my_status: MalStatus;
    my_comments: string;
    my_times_read: number;
    my_tags: string;
    my_priority: MalMangaPriority;
    my_reread_value: string;
    my_rereading: "NO" | "YES";
    my_discuss: "NO" | "YES";
    my_sns: string;
    update_on_import: number;
}

export function normalizeMalMangaEntries(
    manga: MalMangaList["manga"],
): MalMangaListEntry[] {
    return Array.isArray(manga) ? manga : [manga];
}
