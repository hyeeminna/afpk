"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export function UserProfilePopover() {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!user) return null;

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "사용자";

  const email = user.email || "";

  const avatarUrl =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    "";

  const initial = (displayName[0] || "U").toUpperCase();

  // Hover handlers with small debounce for smooth UX
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger: Profile Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="사용자 프로필 메뉴"
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to text initial if image load fails
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        <span className="hidden md:inline-block text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[100px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {displayName}
        </span>

        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label="사용자 프로필 세부 메뉴"
        >
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/70 rounded-xl mb-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {email}
              </span>
            </div>
          </div>

          {/* Quick Menu */}
          <div className="space-y-1 text-xs">
            <Link
              href="/diagnosis"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">
                assignment
              </span>
              <span>내 재무 진단 페이지</span>
            </Link>

            <Link
              href="/#quick-check"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
                speed
              </span>
              <span>1분 간편 점검 다시하기</span>
            </Link>
          </div>

          <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={async () => {
              setIsOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
            <span>Sign out (로그아웃)</span>
          </button>
        </div>
      )}
    </div>
  );
}
