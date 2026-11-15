"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { UserProfilePopover } from "@/components/user-profile-popover";

export interface CoreConcernItem {
  id: string;
  rankBadge: string;
  rankBadgeColor: string;
  title: string;
  quote: string;
  solutionBrief: string;
  icon: string;
  goalName: string;
  category: string;
}

export const CORE_CONCERNS: CoreConcernItem[] = [
  {
    id: "debt",
    rankBadge: "🥇 1순위 목표",
    rankBadgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    title: "은퇴 전 대출 2.5억 전액 상환",
    quote: "“퇴직 전에 남아있는 아파트 담보대출 원리금(월 185만 원) 부담을 말끔히 없애고 싶어요.”",
    solutionBrief: "현금 1억 + 퇴직금 1.5억 상환으로 월 원리금 지출 0원화",
    icon: "credit_card",
    goalName: "은퇴 전 대출 2.5억 전액 상환",
    category: "부채 상환",
  },
  {
    id: "wedding",
    rankBadge: "🥈 2순위 목표",
    rankBadgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    title: "자녀(장남) 결혼자금 7,000만 원 지원",
    quote: "“자녀 독립과 결혼 시점에 맞춰 7,000만 원 목돈을 노후자금 훼손 없이 안전하게 지원하고 싶어요.”",
    solutionBrief: "보유 정기예금 2억 원 중 분할 집행으로 부채 없는 자녀 지원 플랜",
    icon: "celebration",
    goalName: "장남 결혼자금 7,000만 원 마련",
    category: "목돈 마련",
  },
  {
    id: "living",
    rankBadge: "🥉 3순위 목표",
    rankBadgeColor: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-700",
    title: "은퇴 후 생활비 월 300만 원 평생 확보",
    quote: "“퇴직 후 소득 공백기(61~64세)를 버티고, 100세 종신까지 월 300만 원 생활비를 만들고 싶어요.”",
    solutionBrief: "부족액 3.2억 원을 IRP 연금수령 절세(30%) + 71세 주택연금 연계로 완벽 보장",
    icon: "shield",
    goalName: "은퇴 후 생활비 월 300만 원 확보",
    category: "은퇴 생활비",
  },
  {
    id: "inheritance",
    rankBadge: "🏅 4순위 목표",
    rankBadgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    title: "상가주택 상속 대비 및 절세 플랜",
    quote: "“보유 상가주택 상속세(예상 7,760만 원)에 대해 사전 절세 플랜과 가족 간 합의를 마치고 싶어요.”",
    solutionBrief: "상속세 연부연납 제도 + 상가 임대수익 활용 사전 협의 및 절세 솔루션",
    icon: "domain",
    goalName: "상가주택 상속 및 절세 대비",
    category: "상속 및 절세",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, profile, signInWithGoogle, isLoading: isAuthLoading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Character Tab State: findoc1 (3D 처방전) vs findoc2 (2D 리포트)
  const [activeDoctorTab, setActiveDoctorTab] = useState<"findoc1" | "findoc2">("findoc1");

  // 4대 핵심 고민 단일 선택 상태 (기본값: 은퇴 생활비 확보)
  const [selectedConcernId, setSelectedConcernId] = useState<string>("living");

  const checkSectionRef = useRef<HTMLElement>(null);

  // Smooth scroll to core concerns section
  const handleScrollToCheck = () => {
    checkSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle Google Login via Supabase OAuth
  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google 로그인 실패:", err);
      alert(
        err?.message ||
          "Google 로그인 진행 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 선택된 고민으로 맞춤 재무설계 시작
  const handleStartDiagnosis = (item?: CoreConcernItem) => {
    const target = item || CORE_CONCERNS.find((c) => c.id === selectedConcernId) || CORE_CONCERNS[2];
    try {
      sessionStorage.setItem("financialDoctor_concern", target.title);
      sessionStorage.setItem("financialDoctor_goalName", target.goalName);
    } catch {
      // safe fallback
    }
    router.push("/diagnosis");
  };

  const selectedConcernItem =
    CORE_CONCERNS.find((c) => c.id === selectedConcernId) || CORE_CONCERNS[2];

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="h-20 max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/images/doctor-icon.png"
                alt="재무주치의"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                재무주치의
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase mt-1">
                50·60 은퇴 안심 케어
              </span>
            </div>
          </Link>

          {/* Navigation & Theme Toggle */}
          <div className="flex items-center gap-4 md:gap-6">
            <nav className="hidden sm:flex items-center gap-5 text-[15px] font-bold text-slate-700 dark:text-slate-300">
              <a
                href="#intro"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
              >
                서비스 소개
              </a>
              <a
                href="#core-concerns"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
              >
                4대 고민 선택
              </a>
              {!user && !isAuthLoading && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 cursor-pointer font-bold disabled:opacity-50"
                >
                  {isLoggingIn ? "연결 중..." : "로그인"}
                </button>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {user && <UserProfilePopover />}
              <ThemeToggle />
              <Link
                href="/diagnosis"
                className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <span>진단 페이지</span>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 flex-grow">
        {/* ================= A. 서비스 소개 (Intro) ================= */}
        <section
          id="intro"
          className="w-full pt-10 md:pt-16 pb-14 md:pb-20 bg-gradient-to-b from-blue-50/70 via-white to-surface dark:from-slate-900 dark:via-slate-900/80 dark:to-[#0B1120] border-b border-slate-200/70 dark:border-slate-800"
        >
          <div className="max-w-6xl mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Headlines & CTA */}
              <div className="lg:col-span-7 space-y-6">
                {/* 상단 안내 문구 */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 text-sm md:text-[15px] font-bold border border-blue-200 dark:border-blue-800 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 inline-block" />
                  <span>50·60대를 위한 은퇴 준비 맞춤 진단</span>
                </div>

                {/* H1 */}
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.25] md:leading-[1.22]">
                  나의 재무상태,
                  <br />
                  <span className="text-blue-600 dark:text-blue-400 underline decoration-amber-400 dark:decoration-amber-500 decoration-8 underline-offset-8">
                    이대로 괜찮을까요?
                  </span>
                </h1>

                {/* 설명 */}
                <p className="text-[17px] md:text-xl text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl font-normal">
                  은퇴 후 생활비, 부채 상환, 자녀 결혼자금, 부동산 상속세가 걱정되시나요?
                  지금 가장 해결하고 싶은 핵심 고민을 선택하고, AFPK 공인 재무설계 기준의 맞춤 처방을 확인해 보세요.
                </p>

                {/* 주요 버튼 */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleScrollToCheck}
                    className="h-14 md:h-[58px] px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-lg md:text-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <span>4대 핵심 고민 선택하기</span>
                    <span className="material-symbols-outlined text-[24px]">
                      arrow_downward
                    </span>
                  </button>
                </div>

                {/* 안심 포인트 뱃지 */}
                <div className="pt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                      check_circle
                    </span>
                    로그인 없이 즉시 선택
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                      check_circle
                    </span>
                    계좌 비밀번호 요구 없음
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                      check_circle
                    </span>
                    공인재무설계 기준
                  </span>
                </div>
              </div>

              {/* Right Column: Hero Graphic Card */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden transition-all duration-300">
                  {/* Tab Selector: findoc1 vs findoc2 */}
                  <div className="p-2 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveDoctorTab("findoc1")}
                      className={`flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeDoctorTab === "findoc1"
                          ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      안심 노후 처방
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDoctorTab("findoc2")}
                      className={`flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeDoctorTab === "findoc2"
                          ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      든든 은퇴 리포트
                    </button>
                  </div>

                  {/* Character Illustration */}
                  <div
                    className={`w-full relative overflow-hidden transition-colors duration-300 ${
                      activeDoctorTab === "findoc1"
                        ? "bg-[#FAF7F2] dark:bg-slate-900"
                        : "bg-[#F2F6F0] dark:bg-slate-900"
                    }`}
                  >
                    <img
                      src={activeDoctorTab === "findoc1" ? "/images/findoc1.png" : "/images/findoc2.png"}
                      alt={
                        activeDoctorTab === "findoc1"
                          ? "노후 자산, 안심하고 준비하세요 - 재무주치의 처방전"
                          : "당신의 든든한 재무주치의 - 은퇴 준비 리포트"
                      }
                      className="w-full h-auto block object-cover saturate-[0.88] hover:saturate-100 transition-all duration-300"
                      style={{ imageRendering: "-webkit-optimize-contrast" }}
                    />
                  </div>

                  {/* Status Bar */}
                  <div className="px-5 py-3.5 bg-white dark:bg-slate-800/95 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                      <span className="material-symbols-outlined text-[18px]">
                        verified
                      </span>
                      {activeDoctorTab === "findoc1"
                        ? "은퇴 준비 안심 처방"
                        : "1:1 은퇴 준비 종합 리포트"}
                    </span>
                    <span className="text-slate-400">맞춤형 자산 케어</span>
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="mt-3.5 w-full max-w-md grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveDoctorTab("findoc1")}
                    className={`p-2 rounded-2xl border-2 transition-all flex items-center gap-2.5 text-left cursor-pointer ${
                      activeDoctorTab === "findoc1"
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#FAF7F2] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex-shrink-0">
                      <img
                        src="/images/findoc1.png"
                        alt="findoc1 처방전 썸네일"
                        className="w-full h-full object-cover saturate-[0.88]"
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold leading-tight ${
                          activeDoctorTab === "findoc1"
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        노후 자산 처방
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        안심 자산 준비
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDoctorTab("findoc2")}
                    className={`p-2 rounded-2xl border-2 transition-all flex items-center gap-2.5 text-left cursor-pointer ${
                      activeDoctorTab === "findoc2"
                        ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F2F6F0] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex-shrink-0">
                      <img
                        src="/images/findoc2.png"
                        alt="findoc2 리포트 썸네일"
                        className="w-full h-full object-cover saturate-[0.88]"
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold leading-tight ${
                          activeDoctorTab === "findoc2"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        은퇴 준비 리포트
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        든든 재무주치의
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= B. 4대 핵심 고민 선택 (단일 선택) ================= */}
        <section
          ref={checkSectionRef}
          id="core-concerns"
          className="w-full py-14 md:py-20 bg-white dark:bg-[#0E1628] border-b border-slate-200 dark:border-slate-800 scroll-mt-20"
        >
          {/* 하위 호환용 앵커 */}
          <span id="quick-check" className="block -mt-20 pt-20 invisible" />

          <div className="max-w-4xl mx-auto px-5 md:px-8">
            {/* Section Header */}
            <div className="text-center space-y-2.5 mb-10">
              <span className="inline-block px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs md:text-sm font-bold uppercase tracking-wider shadow-xs">
                ✦ 공인 AFPK 은퇴 재무설계
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                4대 핵심 은퇴 고민 선택
              </h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto">
                지금 가장 해결하고 싶은 은퇴 고민 하나를 선택해 주세요.
                <br className="hidden sm:inline" />
                선택하신 고민을 바탕으로 맞춤 재무상태표, 현금흐름표 및 전문 솔루션을 즉시 진단합니다.
              </p>
            </div>

            {/* 4 Cards Grid (Single Select) */}
            <div
              role="radiogroup"
              aria-label="4대 핵심 은퇴 고민 선택"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
            >
              {CORE_CONCERNS.map((item) => {
                const isSelected = selectedConcernId === item.id;
                return (
                  <div
                    key={item.id}
                    tabIndex={0}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedConcernId(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedConcernId(item.id);
                      }
                    }}
                    className={`p-5 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 select-none relative overflow-hidden group ${
                      isSelected
                        ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-600 dark:border-blue-400 shadow-xl ring-2 ring-blue-200 dark:ring-blue-900 scale-[1.01]"
                        : "bg-surface-container-low dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
                    }`}
                  >
                    {/* Top Row: Badge & Custom Radio indicator */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${item.rankBadgeColor}`}
                      >
                        {item.rankBadge}
                      </span>

                      {/* Custom Radio Circle */}
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? "border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-500"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400"
                        }`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-white text-[16px] font-bold">
                            check
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Title & Quote */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[22px]">
                          {item.icon}
                        </span>
                        <h3
                          className={`text-lg sm:text-xl font-extrabold leading-snug tracking-tight ${
                            isSelected
                              ? "text-blue-950 dark:text-white"
                              : "text-slate-800 dark:text-slate-100"
                          }`}
                        >
                          {item.title}
                        </h3>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed bg-white/70 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {item.quote}
                      </p>
                    </div>

                    {/* Bottom: Solution Brief Tag */}
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">
                        핵심 솔루션:
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 truncate text-right">
                        {item.solutionBrief}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0F224A] via-[#162D63] to-[#1E3A8A] text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs text-blue-200 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>선택된 핵심 고민 (단일 선택)</span>
                </div>
                <div className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {selectedConcernItem.title}
                </div>
                <p className="text-xs text-blue-100">
                  선택하신 고민을 기반으로 재무상태표, 현금흐름표 및 맞춤 솔루션이 연동됩니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStartDiagnosis()}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-base shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>맞춤 재무설계 시작하기</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= C. 로그인 (Login) ================= */}
        <section
          id="login"
          className="w-full py-14 md:py-20 bg-slate-50 dark:bg-[#070D1E] border-b border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-3xl mx-auto px-5 md:px-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[32px]">
                lock
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              내 재무계획을 저장하고 관리해 보세요
            </h2>

            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto font-normal">
              로그인하면 재무설계안과 월별 자산 변화를 저장하고 언제든지 다시 확인할 수 있습니다.
            </p>

            <div className="pt-2 flex flex-col items-center justify-center gap-3">
              {user ? (
                <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-900/60 shadow-md space-y-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    로그인 완료
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0]}님, 환영합니다!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {user.email} 계정에 재무설계안이 안전하게 보관됩니다.
                    </p>
                  </div>
                  <Link
                    href="/diagnosis"
                    className="inline-flex items-center justify-center gap-2 w-full h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    <span>내 재무진단 바로가기</span>
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full sm:w-auto min-w-[280px] h-13 md:h-14 px-8 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-60 text-slate-800 dark:text-white font-bold text-base md:text-lg flex items-center justify-center gap-3.5 cursor-pointer disabled:cursor-wait border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
                >
                  {isLoggingIn ? (
                    <>
                      <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span>Google 로그인 연결 중...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        aria-hidden="true"
                        className="w-5 h-5 flex-shrink-0"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.25C.45 8.15 0 9.99 0 12s.45 3.85 1.25 5.43l4.03-3.14z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>Google 계정으로 시작하기</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 pt-2">
              ※ 고민 선택 및 기본 진단은 로그인 없이 언제든지 무료로 이용하실 수 있습니다.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-5 md:px-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white overflow-hidden flex-shrink-0">
              <img
                src="/images/doctor-icon.png"
                alt="재무주치의"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              재무주치의
            </span>
          </div>

          <p className="text-xs md:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl font-normal">
            면책 조항: 재무주치의에서 제공하는 진단 결과 및 시뮬레이션은 정보
            제공 및 자가 점검 목적이며, 법적 투자 자문 또는 대출 보증을 의미하지
            않습니다. 실제 금융 상품 계약 및 실행 조건은 해당 금융기관의 심사
            기준에 따릅니다.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 gap-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-normal">
            <p>© 2026 재무주치의. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#intro" className="hover:text-blue-600 transition-colors">
                서비스 소개
              </a>
              <a
                href="#core-concerns"
                className="hover:text-blue-600 transition-colors"
              >
                4대 고민 선택
              </a>
              <Link
                href="/diagnosis"
                className="hover:text-blue-600 transition-colors"
              >
                진단 페이지
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
