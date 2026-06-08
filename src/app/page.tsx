"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSlashHook } from "@/lib/hooks/slashHook";
import { Media } from "@/models/media";
import { getAnimeData, getMangaData } from "@/lib/api/jikan";
import { clsxm } from "@/lib/helper/clsxm";
import TldrawCanvas from "./containers/TldrawCanvas";
import { AssetRecordType, type Editor } from "tldraw";

export default function Home() {
  const { isOpen, query, setQuery, position, close } = useSlashHook();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaData, setMediaData] = useState<Media[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [colorScheme, setColorScheme] = useState<"dark" | "light">("light");

  const seedAnimeData = async (media: string) => {
    const data = await getAnimeData(media);

    const mediaData = data.data.map((item) => ({
      mal_id: item.mal_id,
      url: item.url,
      images: item.images,
      approved: item.approved,
      titles: item.titles,
      title: item.title,
      rating: item.score.toString(),
    }));
    
    setMediaData(mediaData);    
  }

  const seedMangaData = async (media: string) => {
    const data = await getMangaData(media);
    const mediaData = data.data.map((item) => ({
      mal_id: item.mal_id,
      url: item.url,
      images: item.images,
      approved: item.approved,
      titles: item.titles,
      title: item.title,
      rating: item.score?.toString() ?? "N/A",
    }));

    setMediaData(mediaData);    
  }

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const media = query.split("/").at(0);
    const title = query.split("/").at(1);

    if ((media !== "anime" && media !== "manga") || !title) {
      setIsLoading(false);
      setMediaData([]);
      return;
    }

    setIsLoading(true);
    
    const timeoutId = window.setTimeout(() => {
      if (media === "anime") {
        void seedAnimeData(title);
      } else {
        void seedMangaData(title);
      }
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
      setMediaData([]);
    };
  }, [query]);

  useEffect(() => {
    if (mediaData.length > 0) {
      setIsLoading(false);
    }
  }, [mediaData]);

  useEffect(() => {
    setSelectedIndex(0);
    itemRefs.current = [];
  }, [mediaData]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, mediaData]);

  useEffect(() => {
    // editor.
  }, [])

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }

  const moveSelection = useCallback(
    (direction: "up" | "down") => {
      setSelectedIndex((prev) => {
        if (mediaData.length === 0) return 0;

        if (direction === "down") {
          return Math.min(prev + 1, mediaData.length - 1);
        }

        return Math.max(prev - 1, 0);
      });
    },
    [mediaData.length],
  );

  const handleOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;

    if ((event.key === "Backspace" && value.length === 0) || event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    // add the selected to item to be placed on the tldraw canvas
    if (event.key === "Enter") {
      console.log(mediaData[selectedIndex]);
      event.preventDefault();
      void addToCanvas(mediaData[selectedIndex]);
      return;
    }

    if (!isLoading && mediaData.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection("down");
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection("up");
      }
    }
  };

  const handleOnBlur = () => {
    close();
  }

  const handleOnThemeChange = (theme: "dark" | "light") => {
    setColorScheme(theme);
  }

  const loadImageSize = (src: string) =>
    new Promise<{ w: number; h: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        resolve({ w: image.naturalWidth, h: image.naturalHeight });
      image.onerror = reject;
      image.src = src;
    });

  const addToCanvas = async (media: Media) => {
    if (!editor) return;

    const imageUrl = media.images.jpg.image_url ?? "https://placehold.co/300x400/jpg?text=4:3";
    const assetId = AssetRecordType.createId();
    const displayWidth = 300;

    let sourceWidth = displayWidth;
    let sourceHeight = 400;
    
    const size = await loadImageSize(imageUrl);
    sourceWidth = size.w;
    sourceHeight = size.h;

    const displayHeight = (sourceHeight / sourceWidth) * displayWidth;
    const center = editor.getViewportPageBounds().center;

    editor.createAssets([
      {
        id: assetId,
        type: "image",
        typeName: "asset",
        props: {
          name: media.title,
          src: imageUrl,
          w: sourceWidth,
          h: sourceHeight,
          mimeType: "image/jpeg",
          isAnimated: false,
        },
        meta: {},
      },
    ]);

    editor.createShape({
      type: "image",
      x: center.x - displayWidth / 2,
      y: center.y - displayHeight / 2,
      meta: {
        title: media.title,
        rating: media.rating,
        malId: media.mal_id,
        url: media.url,
      },
      props: {
        assetId,
        w: displayWidth,
        h: displayHeight,
        altText: media.title,
      },
    });
  };

  return (
    <div className="w-full h-screen">
      <div className="absolute top-0 w-full z-10 flex justify-center items-center gap-2">
        <div className="flex gap-4 bg-background rounded-b-lg p-2 shadow-md">
          <button className={clsxm("text-[12px] text-zinc-500 cursor-pointer", colorScheme === "dark" && "text-zinc-800")} onClick={() => handleOnThemeChange("dark")}>Dark</button>
          <button className={clsxm("text-[12px] text-zinc-500 cursor-pointer", colorScheme === "light" && "text-zinc-800")} onClick={() => handleOnThemeChange("light")}>Light</button>
        </div>
      </div>
      {isOpen && (
        <div
          className="flex flex-col gap-4 fixed z-50 rounded-md border border-zinc-300 bg-white px-2 py-1 shadow-md"
          style={{ left: position.x, top: position.y }}
          ref={containerRef}
        >
          <div className="flex items-center gap-1">
            <span className="text-xs">/</span>
            <input
              ref={inputRef}
              onBlur={handleOnBlur}
              value={query}
              onChange={handleOnChange}
              onKeyDown={handleOnKeyDown}
              placeholder="Search..."
              className="w-40 bg-transparent text-sm text-zinc-800 outline-none"
            />
          </div>
          <div className="flex flex-col gap-2 pb-1 max-h-64 overflow-y-scroll">
            {
              isLoading ? (
                <div className="text-sm text-zinc-500">Loading...</div>
              ) : mediaData.length > 0 ? mediaData.map((media, idx) => (
                <div
                  ref={(element) => {
                    itemRefs.current[idx] = element;
                  }}
                  className={clsxm(
                    "flex gap-2 scroll-m-1",
                    selectedIndex === idx && "bg-blue-400 text-white rounded-md",
                  )}
                  key={media.mal_id}
                >
                  <img src={media.images.jpg.image_url} alt={media.title} className="w-24 h-32 p-2 rounded-sm" />
                  <div className="flex flex-col">
                    <p className="font-semibold">{media.title}</p>
                    <p className="text-sm text-zinc-500">{media.rating}</p>
                  </div>
                </div>
              )) :
              <div className="text-sm text-zinc-500">No results found</div>
            }
          </div>
        </div>
      )}
      <TldrawCanvas onMount={setEditor} colorScheme={colorScheme} />
    </div>
  );
}
