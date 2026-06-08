"use client";

import { useEffect, useState } from "react";

const TOUCH_DEVICE_QUERY = "(hover: none) and (pointer: coarse)";

export default function MobileExperienceOverlay() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const touchQuery = window.matchMedia(TOUCH_DEVICE_QUERY);

    const update = () => {
      setIsTouchDevice(touchQuery.matches);
    };

    update();
    touchQuery.addEventListener("change", update);

    return () => {
      touchQuery.removeEventListener("change", update);
    };
  }, []);

  if (!isTouchDevice) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-zinc-950/90 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-experience-title"
    >
      <div className="max-w-md rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-8 text-center shadow-2xl">
        <h1
          id="mobile-experience-title"
          className="mb-3 text-lg font-semibold text-white"
        >
          Desktop recommended
        </h1>
        <p className="text-sm leading-relaxed text-zinc-300">
        Use a desktop for the full experience.
        </p>
      </div>
    </div>
  );
}
