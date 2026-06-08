import { useCallback, useEffect, useRef, useState } from "react";

export const useSlashHook = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;

      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isOpenRef.current) return;
      setPosition({ x: event.clientX, y: event.clientY });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !isOpenRef.current && !isTypingTarget(event.target)) {
        event.preventDefault();
        setIsOpen(true);
        setPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return {
    isOpen,
    query,
    setQuery,
    position,
    close,
  };
};