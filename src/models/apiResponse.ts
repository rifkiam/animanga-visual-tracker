export type JikanServerStatus = {
    author_url: string;
    discord_url: string;
    version: string;
    parser_version: string;
    website_url: string;
    documentation_url: string;
    github_url: string;
    parser_github_url: string;
    production_api_url: string;
    status_url: string;
    myanimelist_heartbeat: {
        status: string;
        score: number;
        down: boolean;
        last_downtime: number;
    };
  };

export type JikanMediaData = {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  title: string;
  rating?: string;
};

export interface JikanSingleResponse {
  data: JikanMediaData;
}

export interface JikanResponse {
    pagination: {
        last_visible_page: number,
        has_next_page: boolean,
        current_page: number,
        items: {
            count: number,
            total: number,
            per_page: number
        }
    },
    data: {
        mal_id: number,
        url: string,
        images: {
            jpg: {
                image_url: string,
                small_image_url: string,
                large_image_url: string,
            },
            webp: {
                image_url: string,
                small_image_url: string,
                large_image_url: string,
            }
        },
        approved: true,
        titles: { type: string, title: string }[],
        title: string,
        title_english: string,
        title_japanese: string,
        title_synonyms: string[],
        type: string,
        chapters: number,
        volumes: number,
        status: string,
        publishing: false,
        published: {
            from: string,
            to: string,
            prop: {
                from: {
                    day: number,
                    month: number,
                    year: number
                },
                to: {
                    day: number,
                    month: number,
                    year: number
                }
            },
            string: string
        },
        score: number,
        scored: number,
        scored_by: number,
        rank: number,
        popularity: number,
        members: number,
        favorites: number,
        synopsis: string,
        background: string,
        authors: {
            mal_id: number,
            type: string,
            name: string,
            url: string,
        }[],
        serializations: {
            mal_id: number,
            type: string,
            name: string,
            url: string,
        }[],
        genres: {
            mal_id: number,
            type: string,
            name: string,
            url: string,
        }[],
        explicit_genres: {
            mal_id: number,
            type: string,
            name: string,
            url: string,
        }[],
        themes: {
            mal_id: number,
            type: string,
            name: string,
            url: string,
        }[],
        demographics: {
            mal_id: number,
            type: string,
            name: string,
            url: string,
        }[]
    }[],
}