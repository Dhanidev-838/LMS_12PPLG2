"use client";

import { useSyncExternalStore, type Dispatch, type SetStateAction } from "react";

type Theme = "light" | "dark";
const THEME_KEY = "admin-theme";
const THEME_CHANGE_EVENT = "admin-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getSnapshot(): Theme {
  return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useAdminTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setTheme: Dispatch<SetStateAction<Theme>> = (nextTheme) => {
    const resolvedTheme = typeof nextTheme === "function" ? nextTheme(getSnapshot()) : nextTheme;
    window.localStorage.setItem(THEME_KEY, resolvedTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return [theme, setTheme] as const;
}