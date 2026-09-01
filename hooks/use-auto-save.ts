"use client";

import { useEffect, useRef } from "react";

export function useAutoSave<T>(value: T, save: (value: T) => Promise<void> | void, delay = 600) {
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void save(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, save, delay]);
}
