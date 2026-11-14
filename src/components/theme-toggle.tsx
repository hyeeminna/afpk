"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <button
      id="theme-toggle"
      type="button"
      aria-label="다크 모드 전환"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative inline-flex items-center justify-between w-14 h-8 px-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 dark:border-slate-700 transition-colors duration-200 cursor-pointer shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <span className="material-symbols-outlined text-[15px] text-amber-500 select-none">
        light_mode
      </span>
      <span className="material-symbols-outlined text-[15px] text-slate-400 select-none">
        dark_mode
      </span>
      <span
        id="theme-toggle-knob"
        className={`absolute top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-md transform transition-transform duration-200 flex items-center justify-center pointer-events-none ${
          isDark ? "translate-x-6 left-1" : "left-1 translate-x-0"
        }`}
      >
        <span
          id="theme-toggle-icon"
          className={`material-symbols-outlined text-[14px] ${
            isDark ? "text-amber-300" : "text-primary"
          }`}
        >
          {isDark ? "dark_mode" : "light_mode"}
        </span>
      </span>
    </button>
  );
}
