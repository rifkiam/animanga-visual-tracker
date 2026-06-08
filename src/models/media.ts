export interface Media {
    mal_id: number;
    url: string;
    images: {
        jpg: {
            image_url: string;
            small_image_url: string;
            large_image_url: string;
        };
    };
    approved: boolean;
    titles: { type: string; title: string }[];
    title: string;
    rating: string;
}