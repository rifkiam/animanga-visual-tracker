"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSlashHook } from "@/lib/hooks/slashHook";
import { useIsCoarsePointer } from "@/lib/hooks/useIsCoarsePointer";
import { useTouchLongPress } from "@/lib/hooks/useTouchLongPress";
import { Media } from "@/models/media";
import { getAnimeData, getMangaData } from "@/lib/api/jikan";
import { clsxm } from "@/lib/helper/clsxm";
import TldrawCanvas from "./containers/TldrawCanvas";
import { AssetRecordType, type Editor } from "tldraw";

export default function Home() {
  const { isOpen, query, setQuery, position, openAt, close } = useSlashHook();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isCoarsePointer = useIsCoarsePointer();

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaData, setMediaData] = useState<Media[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
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
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [isOpen]);

  useTouchLongPress({
    targetRef: canvasWrapperRef,
    enabled: !isOpen,
    onLongPress: openAt,
    shouldIgnoreTarget: (target) =>
      containerRef.current?.contains(target as Node) ?? false,
  });

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      close();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, close]);

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
      props: {
        assetId,
        w: displayWidth,
        h: displayHeight,
      },
    });
  };

  const handleResultSelect = (media: Media, idx: number) => {
    setSelectedIndex(idx);
    void addToCanvas(media);
    close();
  };

  return (
    <div className="relative w-full h-screen">
      {isOpen && (
        <div
          className="flex flex-col gap-4 fixed z-50 max-w-[min(20rem,calc(100vw-1rem))] rounded-md border border-zinc-300 bg-white px-2 py-1 shadow-md touch-none"
          style={{ left: position.x, top: position.y }}
          ref={containerRef}
        >
          <div className="flex items-center gap-1">
            <span className="text-xs">/</span>
            <input
              ref={inputRef}
              value={query}
              onChange={handleOnChange}
              onKeyDown={handleOnKeyDown}
              placeholder="..."
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none"
            />
          </div>
          <div className="flex flex-col gap-2 pb-1 max-h-64 overflow-y-auto overscroll-contain">
            {
              isLoading ? (
                <div className="text-sm text-zinc-500">Loading...</div>
              ) : mediaData.length > 0 ? mediaData.map((media, idx) => (
                <div
                  ref={(element) => {
                    itemRefs.current[idx] = element;
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleResultSelect(media, idx)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleResultSelect(media, idx);
                    }
                  }}
                  className={clsxm(
                    "flex gap-2 scroll-m-1 cursor-pointer active:opacity-80",
                    selectedIndex === idx && "bg-blue-400 text-white rounded-md",
                  )}
                  key={media.mal_id}
                >
                  <img src={media.images.jpg.image_url} alt={media.title} className="w-24 h-32 p-2 rounded-md" />
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
      <div ref={canvasWrapperRef} className="h-full w-full touch-manipulation">
        <TldrawCanvas onMount={setEditor} />
      </div>
    </div>
  );
}
