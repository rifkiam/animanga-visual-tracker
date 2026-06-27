import {
  JikanResponse,
  JikanServerStatus,
  type JikanMediaData,
  type JikanSingleResponse,
} from "@/models/apiResponse";

export const getServerStatus = async (): Promise<JikanServerStatus> => {
  const response = await fetch("https://api.jikan.moe/");

  if (!response.ok) {
    throw new Error(`Jikan status check failed (${response.status})`);
  }

  const data = (await response.json()) as JikanServerStatus;
  return data;
};

export const getAnimeData = async (query: string): Promise<JikanResponse> => {
  const response = await fetch(
    `https://api.jikan.moe/v4/anime?q=${query}&limit=${process.env.NEXT_PUBLIC_JIKAN_SEARCH_LIMIT ?? 5}`,
  );
  const data = (await response.json()) as JikanResponse;
  return data;
};

export const getMangaData = async (query: string): Promise<JikanResponse> => {
  const response = await fetch(
    `https://api.jikan.moe/v4/manga?q=${query}&limit=${process.env.NEXT_PUBLIC_JIKAN_SEARCH_LIMIT ?? 5}`,
  );
  const data = (await response.json()) as JikanResponse;
  return data;
};

export const getAnimeById = async (malId: number): Promise<JikanMediaData> => {
  const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
  if (response.status === 429) {
    throw new Error('Rate limit exceeded, try again in a minute');
  } else if (!response.ok) {
    throw new Error(`Failed to fetch anime ${malId}`);
  }

  const data = (await response.json()) as JikanSingleResponse;
  return data.data;
};

export const getMangaById = async (malId: number): Promise<JikanMediaData> => {
  const response = await fetch(`https://api.jikan.moe/v4/manga/${malId}`);
  if (response.status === 429) {
    throw new Error('Rate limit exceeded, try again in a minute');
  } else if (!response.ok) {
    throw new Error(`Failed to fetch manga ${malId}`);
  }

  const data = (await response.json()) as JikanSingleResponse;
  return data.data;
};