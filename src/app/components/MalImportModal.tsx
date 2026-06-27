"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsxm } from "@/lib/helper/clsxm";
import {
  parseMalListExport,
  type MalImportSuccess,
  type MalListType,
} from "@/lib/mal/parseMalListExport";
import { Upload, X } from "lucide-react";

type MalImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  colorScheme: "dark" | "light";
  onSuccess: (result: MalImportSuccess) => void;
  onError: (message: string) => void;
};

export default function MalImportModal({
  isOpen,
  onClose,
  colorScheme,
  onSuccess,
  onError,
}: MalImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listType, setListType] = useState<MalListType>("anime");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setFile(null);
    setValidationErrors([]);
    setIsImporting(false);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setListType("anime");
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const acceptFile = (nextFile: File | null) => {
    if (!nextFile) return;

    if (!nextFile.name.toLowerCase().endsWith(".xml")) {
      onError("Please select a .xml file");
      return;
    }

    setFile(nextFile);
    setValidationErrors([]);
  };

  const handleImport = async () => {
    if (!file) {
      onError("Choose an XML file to import");
      return;
    }

    setIsImporting(true);
    setValidationErrors([]);

    try {
      const xml = await file.text();
      const result = parseMalListExport(xml, listType);

      if (!result.ok) {
        setValidationErrors(result.errors);
        onError(`Import failed: ${result.errors[0] ?? "Invalid file"}`);
        return;
      }

      onSuccess(result.result);

      onClose();
    } catch {
      onError("Could not read the selected file");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close import modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mal-import-title"
        className={clsxm(
          "relative z-10 w-full max-w-md rounded-xl border p-6 shadow-2xl",
          colorScheme === "dark"
            ? "border-zinc-700 bg-zinc-900 text-zinc-100"
            : "border-zinc-200 bg-white text-zinc-900",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="mal-import-title" className="text-lg font-semibold">
              Import MAL list
            </h2>
            <p className="mt-1 text-sm opacity-70">
              Upload your exported MyAnimeList XML file.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={clsxm(
              "cursor-pointer rounded-md p-1 transition-colors",
              colorScheme === "dark"
                ? "hover:bg-zinc-800"
                : "hover:bg-zinc-100",
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium" htmlFor="list-type">
          List type
        </label>
        <select
          id="list-type"
          value={listType}
          onChange={(event) => {
            setListType(event.target.value as MalListType);
            setValidationErrors([]);
          }}
          className={clsxm(
            "mb-4 w-full rounded-md border px-3 py-2 text-sm outline-none",
            colorScheme === "dark"
              ? "border-zinc-700 bg-zinc-800 text-zinc-100"
              : "border-zinc-300 bg-white text-zinc-900",
          )}
        >
          <option value="anime">Anime list (.xml)</option>
          <option value="manga">Manga list (.xml)</option>
        </select>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            acceptFile(event.dataTransfer.files?.[0] ?? null);
          }}
          className={clsxm(
            "mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            isDragging
              ? "border-blue-400 bg-blue-50/10"
              : colorScheme === "dark"
                ? "border-zinc-700 bg-zinc-800/50"
                : "border-zinc-300 bg-zinc-50",
          )}
        >
          <Upload className="mb-2 h-8 w-8 opacity-60" />
          <p className="text-sm font-medium">
            {file ? file.name : "Drag and drop your .xml file here"}
          </p>
          <p className="mt-1 text-xs opacity-60">or choose a file below</p>
        </div>
        
        <div className={clsxm(
          colorScheme === "dark"
          ? "border-zinc-700 bg-zinc-800/50"
          : "border-zinc-300 bg-zinc-50",
          "mb-4 rounded-md border p-2",
        )}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="block w-full cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-600"
            onChange={(event) => acceptFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <p className="mb-4 text-xs opacity-60">
          Sample files:{" "}
          <a
            href="/samples/animelist_sample.xml"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            animelist_sample.xml
          </a>
          {" · "}
          <a
            href="/samples/mangalist_sample.xml"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            mangalist_sample.xml
          </a>
        </p>

        {validationErrors.length > 0 && (
          <div
            className={clsxm(
              "mb-4 max-h-32 overflow-y-auto rounded-md border px-3 py-2 text-xs",
              colorScheme === "dark"
                ? "border-red-900/50 bg-red-950/40 text-red-200"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            <p className="mb-1 font-semibold">Validation errors</p>
            <ul className="list-disc space-y-1 pl-4">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={clsxm(
              "cursor-pointer rounded-md px-4 py-2 text-sm transition-colors",
              colorScheme === "dark"
                ? "bg-zinc-800 hover:bg-zinc-700"
                : "bg-zinc-100 hover:bg-zinc-200",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file || isImporting}
            onClick={() => void handleImport()}
            className="cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
