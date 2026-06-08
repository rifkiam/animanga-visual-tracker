// give me a function to get anime data from the jikan api

import { JikanResponse } from "@/models/apiResponse";

export const getAnimeData = async (query: string): Promise<JikanResponse> => {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=5`);
    const data = await response.json() as JikanResponse;
    return data;
}

export const getMangaData = async (query: string): Promise<JikanResponse> => {
    const response = await fetch(`https://api.jikan.moe/v4/manga?q=${query}&limit=5`);
    const data = await response.json() as JikanResponse;
    return data;
}