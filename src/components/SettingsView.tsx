"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";

interface SettingsViewProps {
  onRefreshData?: () => void;
  onResetData?: () => void;
  // Step 1 상태 수정 콜백
  totalAsset: string;
  setTotalAsset: (v: string) => void;
  totalDebt: string;
  setTotalDebt: (v: string) => void;
  monthlyIncome: string;
  setMonthlyIncome: (v: string) => void;
  monthlyExpense: string;
  setMonthlyExpense: (v: string) => void;
}

export default function SettingsView({
  onRefreshData,
  onResetData,
  totalAsset,
  setTotalAsset,
  totalDebt,
  setTotalDebt,
  monthlyIncome,
  setMonthlyIncome,
  monthlyExpense,
  setMonthlyExpense,
}: SettingsViewProps) {
  const { user, profile, signInWithGoogle, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // 금액 단위 설정 상태 (로컬)
  const [currencyUnit, setCurrencyUnit] = useState<"won" | "man" | "eok">("man");

  // 데이터베이스 동기화 알림
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // 로컬 편집 상태
  const [editAsset, setEditAsset] = useState(totalAsset);
  const [editDebt, setEditDebt] = useState(totalDebt);
  const [editIncome, setEditIncome] = useState(monthlyIncome);
  const [editExpense, setEditExpense] = useState(monthlyExpense);

  const handleSaveData = () => {
    setTotalAsset(editAsset);
    setTotalDebt(editDebt);
    setMonthlyIncome(editIncome);
    setMonthlyExpense(editExpense);
    setSyncStatus("재무 데이터가 성공적으로 저장되었습니다.");
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleRefresh = () => {
    if (onRefreshData) onRefreshData();
    setSyncStatus("Supabase 최신 데이터를 성공적으로 동기화했습니다.");
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleReset = () => {
    setEditAsset("1,721,710,000");
    setEditDebt("250,000,000");
    setEditIncome("8,050,000");
    setEditExpense("7,330,000");
    setTotalAsset("1,721,710,000");
    setTotalDebt("250,000,000");
    setMonthlyIncome("8,050,000");
    setMonthlyExpense("7,330,000");
    if (onResetData) onResetData();
    setSyncStatus("기본 가상 고객(홍길동 님) 데이터로 리셋되었습니다.");
    setTimeout(() => setSyncStatus(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0F224A] via-[#162D63] to-[#1E3A8A] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              환경설정 및 데이터 관리
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
              ● Supabase Cloud
            </span>
          </div>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl">
            실시간 Supabase 데이터베이스와의 동기화 상태를 관리하고, 고객의 재무 데이터를 직접 입력 및 저장합니다.
          </p>
        </div>
      </div>

      {syncStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{syncStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncStatus(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Supabase 데이터베이스 연동 관리 (요청 명세) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🗄️</span>
              <span>Supabase 데이터베이스 연동 관리</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              클라우드 데이터베이스와 프론트엔드 간의 실시간 연동 상태를 제어합니다
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            정상 연결됨 (Supabase vjsrzonqapkudmosehsb)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <span className="text-base">🔄</span>
            <span>Supabase 최신 데이터 불러오기</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <span className="text-base">↩️</span>
            <span>기본 가상 고객 데이터로 리셋</span>
          </button>
        </div>
      </div>

      {/* 3. 재무 데이터 직접 입력 및 저장 관리 */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>✍️</span>
              <span>재무 데이터 직접 입력 및 저장</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              분석에 사용되는 총 자산, 부채, 소득, 지출을 직접 수정하고 시스템에 즉시 반영합니다
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveData}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
          >
            <span>💾</span>
            <span>저장하기</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1.5">
              총 자산 (원)
            </label>
            <input
              type="text"
              value={editAsset}
              onChange={(e) => setEditAsset(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1.5">
              총 부채 (원)
            </label>
            <input
              type="text"
              value={editDebt}
              onChange={(e) => setEditDebt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1.5">
              월 소득 (세후, 원)
            </label>
            <input
              type="text"
              value={editIncome}
              onChange={(e) => setEditIncome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1.5">
              월 지출 (전체, 원)
            </label>
            <input
              type="text"
              value={editExpense}
              onChange={(e) => setEditExpense(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 4. 사용자 계정 & 화면 환경설정 (요청 명세) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>⚙️</span>
            <span>사용자 계정 &amp; 화면 환경설정</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            로그인 정보, 다크 모드, 통화 표기 단위를 설정합니다
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* 현재 로그인 계정 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="프로필 사진"
                  className="w-10 h-10 rounded-full border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {user?.email ? user.email.charAt(0).toUpperCase() : "익명"}
                </div>
              )}
              <div>
                <span className="font-bold text-slate-800 dark:text-white block text-sm">
                  {user ? (user.user_metadata?.full_name || profile?.full_name || user.email) : "로그인되지 않음 (가상 고객 홍길동 님)"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {user ? user.email : "구글 계정으로 로그인하여 본인의 데이터를 안전하게 관리하세요"}
                </span>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="px-3.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 text-xs font-semibold self-start sm:self-auto cursor-pointer"
              >
                로그아웃
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
              >
                Google 계정 로그인
              </button>
            )}
          </div>

          {/* 테마 모드 선택 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <span className="font-bold text-slate-800 dark:text-white block">
                테마 모드 선택
              </span>
              <span className="text-[11px] text-slate-400">
                라이트 모드, 다크 모드, 또는 시스템 설정을 동기화합니다
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                ☀️ 라이트
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                🌙 다크
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  theme === "system"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                💻 시스템
              </button>
            </div>
          </div>

          {/* 금액 표기 단위 설정 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <span className="font-bold text-slate-800 dark:text-white block">
                금액 표기 단위 설정
              </span>
              <span className="text-[11px] text-slate-400">
                차트 및 테이블의 기본 금액 축약 단위를 선택합니다
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCurrencyUnit("won")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currencyUnit === "won"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                원 (예: 8,050,000원)
              </button>
              <button
                type="button"
                onClick={() => setCurrencyUnit("man")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currencyUnit === "man"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                만 원 (예: 805만 원)
              </button>
              <button
                type="button"
                onClick={() => setCurrencyUnit("eok")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currencyUnit === "eok"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                억 원 축약 (예: 14.7억)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
