import { useCallback, useEffect, useRef, useState } from "react";

export const useSlashHook = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const openAt = useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setIsOpen(true);
  }, []);

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

    const handleTouchMove = (event: TouchEvent) => {
      if (!isOpenRef.current || event.touches.length === 0) return;
      const touch = event.touches[0];
      setPosition({ x: touch.clientX, y: touch.clientY });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !isOpenRef.current && !isTypingTarget(event.target)) {
        event.preventDefault();
        openAt(window.innerWidth / 2, window.innerHeight / 2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [openAt]);

  return {
    isOpen,
    query,
    setQuery,
    position,
    openAt,
    close,
  };
};
