import { useEffect, useState } from "react";

export type ReadingPreferences = {
  size: number;
  font: "serif" | "sans";
  paper: "auto" | "warm" | "night";
};
export const READING_KEY = "rin-reading-preferences";
export const DEFAULT_READING: ReadingPreferences = { size: 18, font: "serif", paper: "auto" };

export function parseReadingPreferences(raw: string | null): ReadingPreferences {
  try {
    const value = JSON.parse(raw || "null");
    return {
      size: Number.isInteger(value?.size) && value.size >= 16 && value.size <= 24 ? value.size : 18,
      font: value?.font === "sans" ? "sans" : "serif",
      paper: value?.paper === "warm" || value?.paper === "night" ? value.paper : "auto",
    };
  } catch {
    return { ...DEFAULT_READING };
  }
}

export function useReadingPreferences() {
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    try {
      return parseReadingPreferences(window.localStorage.getItem(READING_KEY));
    } catch {
      return { ...DEFAULT_READING };
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(READING_KEY, JSON.stringify(preferences));
    } catch {
      // Reading still works when browser storage is unavailable or full.
    }
  }, [preferences]);
  return [preferences, setPreferences] as const;
}
