"use client";
import { useEffect } from "react";

export function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T>,
  onOutsideClick: () => void
) {
  useEffect(() => {
    function handleClick(event: Event) {
      const el = ref.current;
      if (el && !el.contains(event.target as Node)) {
        onOutsideClick();
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [ref, onOutsideClick]);
}
