"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSlashHook } from "@/lib/hooks/slashHook";
import { Media } from "@/models/media";
import { getAnimeData, getMangaData } from "@/lib/api/jikan";
import { clsxm } from "@/lib/helper/clsxm";
import { getCookie, setCookie } from "@/lib/helper/cookies";
import {
  useColorScheme,
  type ColorScheme,
} from "@/lib/helper/colorScheme";
import { useJikanServerStatus } from "@/lib/helper/jikanServerStatus";

const HELP_TOAST_DISMISSED_COOKIE = "avt-help-toast-dismissed";
import TldrawCanvas from "./containers/TldrawCanvas";
import { type Editor } from "tldraw";
import { toast } from "react-toastify";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { isMediaShapeMeta } from "@/models/mediaShapeMeta";
import MalImportModal from "./components/MalImportModal";
import type { MalImportSuccess } from "@/lib/mal/parseMalListExport";
import { addMediaToCanvas } from "@/lib/canvas/addMediaToCanvas";
import { addMalImportToCanvas } from "@/lib/canvas/addMalImportToCanvas";
import { mediaToCanvasItem } from "@/lib/canvas/canvasMediaItem";

export default function Home() {
  const { isOpen, query, setQuery, position, close } = useSlashHook();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingImport, setIsLoadingImport] = useState(false);
  const [mediaData, setMediaData] = useState<Media[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [colorScheme, setColorScheme] = useColorScheme();
  const jikanStatus = useJikanServerStatus();
  const [cmdList, setCmdList] = useState<{ label: string; desc: string }[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  
  const commands = [
    {
      label: "/anime",
      desc: "Search for an anime"
    },
    {
      label: "/manga",
      desc: "Search for a manga"
    },
    {
      label: "/help",
      desc: "Show help"
    },
    {
      label: "/import",
      desc: "Import your .xml list from MAL"
    },
  ]

  const seedAnimeData = async (title: string) => {
    const data = await getAnimeData(title);

    return data.data.map((item) => ({
      mal_id: item.mal_id,
      url: item.url,
      images: item.images,
      approved: item.approved,
      titles: item.titles,
      title: item.title,
      rating: item.score?.toString() ?? "N/A",
    }));
  };

  const seedMangaData = async (title: string) => {
    const data = await getMangaData(title);

    return data.data.map((item) => ({
      mal_id: item.mal_id,
      url: item.url,
      images: item.images,
      approved: item.approved,
      titles: item.titles,
      title: item.title,
      rating: item.score?.toString() ?? "N/A",
    }));
  };

  const mediaType = query.split("/").at(0);
  const searchTitle = query.split("/").at(1) ?? "";
  const isValidSearch =
    (mediaType === "anime" || mediaType === "manga") && searchTitle.length > 0;

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);

    if (!isValidSearch || !jikanStatus.isOnline) {
      setMediaData([]);
      setIsLoading(false);
    } else {
      setMediaData([]);
      setIsLoading(true);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isValidSearch || !jikanStatus.isOnline) return;

    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const results =
            mediaType === "anime"
              ? await seedAnimeData(searchTitle)
              : await seedMangaData(searchTitle);

          if (!cancelled) {
            setMediaData(results);
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isValidSearch, mediaType, searchTitle, jikanStatus.isOnline]);

  useEffect(() => {
    if (jikanStatus.isOnline) return;

    setIsLoading(false);
    setMediaData([]);
  }, [jikanStatus.isOnline]);

  useLayoutEffect(() => {
    const container = listScrollRef.current;
    const item = itemRefs.current[selectedIndex];

    if (!container || !item) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    if (itemRect.top < containerRect.top) {
      container.scrollTop += itemRect.top - containerRect.top;
    } else if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop += itemRect.bottom - containerRect.bottom;
    }
  }, [selectedIndex, cmdList, mediaData]);

  useEffect(() => {
    if (!editor) return;
    editor.user.updateUserPreferences({ colorScheme });
  }, [editor, colorScheme]);

  useEffect(() => {
    if (!editor) return;

    const cleanupDelete = editor.sideEffects.registerAfterDeleteHandler(
      "shape",
      (shape, _source) => {
        if (shape.type !== "image" || !isMediaShapeMeta(shape.meta)) return;

        const assetId = shape.props.assetId;
        if (!assetId) return;

        const stillUsed = editor
          .getCurrentPageShapes()
          .some(
            (s) => s.type === "image" && s.props.assetId === assetId,
          );

        if (!stillUsed) {
          editor.deleteAssets([assetId]);
        }

        adaptToast("Title removed from canvas", "success");
      },
    );

    const cleanupCreate = editor.sideEffects.registerAfterCreateHandler(
      "shape",
      (shape, _source) => {
        if (shape.type !== "image" || !isMediaShapeMeta(shape.meta)) return;

        adaptToast("Title added to canvas", "success");
      },
    );

    return () => {
      cleanupDelete();
      cleanupCreate();
    };
  }, [editor]);

  useEffect(() => {
    if (getCookie(HELP_TOAST_DISMISSED_COOKIE)) return;

    const toastId = toast("👉 Type /help for more information", {
      theme: colorScheme === "dark" ? "light" : "dark",
      autoClose: 5000,
      onClick: () => {
        setCookie(HELP_TOAST_DISMISSED_COOKIE, "1", 60 * 60 * 24 * 365);
        toast.dismiss(toastId);
      },
    });
  }, []);

  const activeListLength =
    cmdList.length > 0 ? cmdList.length : mediaData.length;

  const moveSelection = useCallback(
    (direction: "up" | "down", listLength = activeListLength) => {
      setSelectedIndex((prev) => {
        if (listLength === 0) return 0;

        if (direction === "down") {
          return Math.min(prev + 1, listLength - 1);
        }

        return Math.max(prev - 1, 0);
      });
    },
    [activeListLength],
  );
  
  const adaptToast = useCallback(
    (message: string, type: "success" | "error" | "warning" | "info", duration: number = 2000) => {
      const formattedMessage = message
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .join("\n");

      const content = (
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {formattedMessage}
        </div>
      );

      toast[type](content, {
        theme: colorScheme === "dark" ? "light" : "dark",
        autoClose: duration
      });
    },
    [colorScheme],
  );

  const warnIfJikanOffline = useCallback(() => {
    if (jikanStatus.isOnline) return false;

    adaptToast(
      jikanStatus.error ??
        "Server is currently down. Search and import are disabled.",
      "warning",
    );
    return true;
  }, [adaptToast, jikanStatus.error, jikanStatus.isOnline]);

  const openImportModal = useCallback(() => {
    if (warnIfJikanOffline()) return;

    close();
    setIsImportModalOpen(true);
  }, [close, warnIfJikanOffline]);

  const handleImportSuccess = useCallback(
    (result: MalImportSuccess) => {
      if (warnIfJikanOffline()) return;

      setIsLoadingImport(true);

      if (!editor) {
        adaptToast("Canvas is not ready yet. Try again in a moment.", "error");
        return;
      }

      adaptToast(
        `Adding ${result.entries.length} ${result.type} entries to canvas…`,
        "info",
        3000,
      );

      void addMalImportToCanvas(editor, result).then(({ added, failed }) => {
        const suffix = failed > 0 ? ` (${failed} could not be loaded)` : "";
        adaptToast(
          `Imported ${added} ${result.type} entries for ${result.myinfo.user_name}${suffix}`,
          added > 0 ? "success" : "error",
        );
        setIsLoadingImport(false);
      });
    },
    [adaptToast, editor, warnIfJikanOffline],
  );

  const handleOnImportQ = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (warnIfJikanOffline()) return;
      openImportModal();
      return;
    }
  };

  const handleOnHelpQ = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      adaptToast(
        `/anime/title — search for an anime
        /manga/title — search for a manga
        /help — show this message
        /import + Enter — import your MAL XML list`,
        "info",
        5000
      );
      return;
    }
  }

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }

  const handleOnKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    const dropdownCmdList = commands.filter((command) =>
      command.label.includes(value),
    );
    setCmdList((prev) => {
      const next = dropdownCmdList.length > 0 ? dropdownCmdList : [];
      if (
        prev.length === next.length &&
        prev.every((cmd, index) => cmd.label === next[index]?.label)
      ) {
        return prev;
      }
      return next;
    });

    if ((event.key === "Backspace" && value.length === 0) || event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (value.length > 0 && value === "import") {
      handleOnImportQ(event);
    } else if (value.length > 0 && value === "help") {
      handleOnHelpQ(event);
    } else if (event.key === "Enter" && dropdownCmdList.length > 0) {
      const selectedCmd = dropdownCmdList[selectedIndex];
      if (selectedCmd?.label === "/import") {
        event.preventDefault();
        if (warnIfJikanOffline()) return;
        openImportModal();
        return;
      }
      if (selectedCmd?.label === "/help") {
        event.preventDefault();
        handleOnHelpQ(event);
        return;
      }
    }

    // add the selected to item to be placed on the tldraw canvas
    if ((value.includes("anime") || value.includes("manga")) && event.key === "Enter") {
      event.preventDefault();
      if (warnIfJikanOffline()) return;
      void addToCanvas(mediaData[selectedIndex]);
      return;
    }

    const canNavigateCmd = dropdownCmdList.length > 0;
    const canNavigateMedia =
      !isLoading && mediaData.length > 0 && dropdownCmdList.length === 0;

    const listLength = dropdownCmdList.length > 0
      ? dropdownCmdList.length
      : mediaData.length;

    if (canNavigateCmd || canNavigateMedia) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection("down", listLength);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection("up", listLength);
      }
    }
  };

  const handleOnBlur = () => {
    setCmdList([]);
    close();
  }

  const handleOnThemeChange = (theme: ColorScheme) => {
    setColorScheme(theme);
  };

  const handleOnMount = useCallback((nextEditor: Editor) => {
    setEditor(nextEditor);
  }, []);

  const addToCanvas = useCallback(
    async (media: Media) => {
      if (!editor || warnIfJikanOffline()) return;
      await addMediaToCanvas(editor, mediaToCanvasItem(media));
    },
    [editor, warnIfJikanOffline],
  );

  return (
    <div className="w-full h-screen">

      {isLoadingImport && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-200 bg-white px-6 py-4 shadow-lg">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
            <p className="text-sm text-zinc-600">Importing your MAL list to canvas</p>
            <p className="text-sm text-zinc-600">This could take a while...</p>
          </div>
        </div>
      )}

      <div className="absolute top-2 w-full z-10 flex flex-col items-center gap-2">
        <div
          className={clsxm(
            "flex items-center gap-1 rounded-lg border p-1 shadow-md transition-colors",
            colorScheme === "dark"
              ? "border-zinc-700 bg-zinc-900"
              : "border-zinc-200 bg-white",
          )}
        >
          <button
            type="button"
            aria-label="Light theme"
            aria-pressed={colorScheme === "light"}
            onClick={() => handleOnThemeChange("light")}
            className={clsxm(
              "cursor-pointer rounded-md p-2 transition-colors",
              colorScheme === "light"
                ? "bg-amber-100 text-amber-600"
                : colorScheme === "dark"
                  ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Dark theme"
            aria-pressed={colorScheme === "dark"}
            onClick={() => handleOnThemeChange("dark")}
            className={clsxm(
              "cursor-pointer rounded-md p-2 transition-colors",
              colorScheme === "dark"
                ? "bg-indigo-500/20 text-indigo-300"
                : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600",
            )}
          >
            <Moon className="h-4 w-4" />
          </button>
        </div>

        {!jikanStatus.isOnline && (
          <div
            role="status"
            className={clsxm(
              "max-w-md rounded-lg border px-3 py-2 text-center text-sm shadow-md",
              colorScheme === "dark"
                ? "border-amber-900/50 bg-amber-950/80 text-amber-200"
                : "border-amber-200 bg-amber-50 text-amber-900",
            )}
          >
            <p className="font-medium">Server is currently down</p>
            <p className="mt-0.5 text-xs opacity-80">
              {jikanStatus.error ??
                "Search and import are disabled until the server is back online"}
            </p>
          </div>
        )}
      </div>
      {isOpen && (
        <div
          className="flex flex-col gap-4 fixed z-50 rounded-md border border-zinc-300 bg-white px-2 py-1 shadow-md"
          style={{ left: position.x, top: position.y }}
          ref={containerRef}
        >
          <div className="flex items-center gap-0.5">
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
          <div
            ref={listScrollRef}
            className="flex flex-col gap-2 pb-1 max-h-64 overflow-y-auto"
          >
            {
              cmdList.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {cmdList.map((cmd, idx) => (
                    <div
                      key={cmd.label}
                      ref={(element) => {
                        itemRefs.current[idx] = element;
                      }}
                      className={clsxm(
                        "scroll-m-1 rounded-md px-2 py-1 text-sm text-zinc-500",
                        selectedIndex === idx &&
                          "bg-blue-400 font-semibold text-white",
                      )}
                    >
                      <span>{cmd.label}</span>
                      <span className="ml-2 text-xs opacity-80">{cmd.desc}</span>
                    </div>
                  ))}
                </div>
              ) :
              isLoading ? (
                <div className="text-sm text-zinc-500">Loading...</div>
              ) : mediaData.length > 0 ? mediaData.map((media, idx) => (
                <div
                  ref={(element) => {
                    itemRefs.current[idx] = element;
                  }}
                  className={clsxm(
                    "flex gap-2 scroll-m-1 w-96",
                    selectedIndex === idx && "bg-blue-400 text-white rounded-md",
                  )}
                  key={media.mal_id}
                >
                  <Image src={media.images.jpg.image_url} alt={media.title} className="w-24 h-32 p-2 rounded-sm" width={96} height={128} />
                  <div className="flex flex-col pt-1.5">
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
      <MalImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        colorScheme={colorScheme}
        onSuccess={handleImportSuccess}
        onError={(message) => adaptToast(message, "error")}
      />
      <TldrawCanvas
        onMount={handleOnMount}
        colorScheme={colorScheme}
      />
    </div>
  );
}
