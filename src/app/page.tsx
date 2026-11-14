"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const RETIREMENT_CONCERNS = [
  "은퇴 후 생활비가 충분할지 걱정돼요",
  "국민연금과 퇴직연금이 궁금해요",
  "은퇴 전에 대출을 갚고 싶어요",
  "모아둔 자산을 어떻게 관리할지 고민이에요",
];

export default function HomePage() {
  const router = useRouter();

  // Character Tab State: findoc1 (3D 처방전) vs findoc2 (2D 리포트)
  const [activeDoctorTab, setActiveDoctorTab] = useState<"findoc1" | "findoc2">("findoc1");

  // Form State
  const [income, setIncome] = useState<string>("");
  const [selectedConcern, setSelectedConcern] = useState<string>("");

  // Validation Error State
  const [incomeError, setIncomeError] = useState<string>("");
  const [concernError, setConcernError] = useState<string>("");

  // Input Ref for Auto Focus
  const incomeInputRef = useRef<HTMLInputElement>(null);
  const checkSectionRef = useRef<HTMLElement>(null);

  // Smooth scroll to quick-check and focus input
  const handleScrollToCheck = () => {
    checkSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      incomeInputRef.current?.focus();
    }, 400);
  };

  // Only allow digits on input
  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setIncome(raw);
    if (incomeError) setIncomeError("");
  };

  // Handle paste: only allow numeric characters
  const handleIncomePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const digitsOnly = pasted.replace(/[^0-9]/g, "");
    setIncome((prev) => prev + digitsOnly);
    if (incomeError) setIncomeError("");
  };

  // Handle Concern selection
  const handleConcernSelect = (concern: string) => {
    setSelectedConcern(concern);
    if (concernError) setConcernError("");
  };

  // Keyboard navigation for radio group
  const handleConcernKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % RETIREMENT_CONCERNS.length;
      handleConcernSelect(RETIREMENT_CONCERNS[nextIndex]);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex =
        (index - 1 + RETIREMENT_CONCERNS.length) % RETIREMENT_CONCERNS.length;
      handleConcernSelect(RETIREMENT_CONCERNS[prevIndex]);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleConcernSelect(RETIREMENT_CONCERNS[index]);
    }
  };

  // Handle Google Login (Supabase 연동 예정)
  const handleGoogleLogin = () => {
    alert("Google 로그인은 Supabase 연동 준비 중입니다. 곧 제공될 예정입니다.");
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    // Validate income: distinction between empty and 0
    if (income.trim() === "") {
      setIncomeError(
        "한 달 소득을 입력해 주세요. (소득이 없는 경우 0을 입력해 주세요)"
      );
      hasError = true;
      incomeInputRef.current?.focus();
    } else {
      setIncomeError("");
    }

    // Validate concern selection
    if (!selectedConcern) {
      setConcernError("은퇴 준비에서 가장 걱정되는 항목을 하나 선택해 주세요.");
      if (!hasError) {
        hasError = true;
      }
    } else {
      setConcernError("");
    }

    if (hasError) return;

    // Convert unit: 300만원 -> 3,000,000원 (0 -> 0원)
    const numericIncome = parseInt(income, 10);
    const wonValue =
      numericIncome === 0
        ? "0"
        : (numericIncome * 10000).toLocaleString("ko-KR");

    // Store in sessionStorage (do NOT expose income in URL query string)
    try {
      sessionStorage.setItem("financialDoctor_income", wonValue);
      sessionStorage.setItem("financialDoctor_incomeRaw", income);
      sessionStorage.setItem("financialDoctor_concern", selectedConcern);
    } catch {
      // safe fallback
    }

    // Move to existing /diagnosis step 1
    router.push("/diagnosis");
  };

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
            <div className="flex flex-col leading-none">
              <span className="text-xl md:text-2xl text-blue-900 dark:text-blue-300 font-extrabold tracking-tight">
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
                href="#quick-check"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
              >
                간편 점검
              </a>
              <a
                href="#login"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
              >
                로그인
              </a>
            </nav>

            <div className="flex items-center gap-3">
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

      {/* Main Content: 3 Sections */}
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
                  <span>50·60대를 위한 은퇴 준비 무료 점검</span>
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
                  은퇴 후 생활비, 연금, 대출, 노후자금이 걱정되시나요? 현재
                  소득과 재무 목표를 입력하고 나에게 필요한 은퇴 준비를 확인해
                  보세요.
                </p>

                {/* 주요 버튼 */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleScrollToCheck}
                    className="h-14 md:h-[58px] px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-lg md:text-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <span>무료로 내 은퇴 건강검진받기</span>
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
                    로그인 없이 즉시 점검
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

              {/* Right Column: Hero Graphic Card showcasing findoc1 & findoc2 */}
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

                  {/* Character Illustration with Framed Fit & Low Saturation */}
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

                {/* Interactive Dual Character Switcher Thumbnails */}
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

        {/* ================= B. 간편 점검 (Quick Check) ================= */}
        <section
          ref={checkSectionRef}
          id="quick-check"
          className="w-full py-14 md:py-20 bg-white dark:bg-[#0E1628] border-b border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-3xl mx-auto px-5 md:px-8">
            {/* Section Header */}
            <div className="text-center space-y-2 mb-10">
              <span className="inline-block px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs md:text-sm font-bold uppercase tracking-wider">
                간편 문진표
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                1분 은퇴 준비 점검
              </h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium">
                계좌 연결 없이 시작할 수 있습니다
              </p>
            </div>

            {/* Diagnostic Card Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-3xl bg-surface-container-low dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700/80 p-6 sm:p-10 shadow-lg space-y-8"
            >
              {/* Question 1: Monthly Income */}
              <div className="space-y-3">
                <label
                  htmlFor="monthly-income"
                  className="block text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-snug"
                >
                  <span className="text-blue-600 dark:text-blue-400 mr-2">Q1.</span>
                  현재 한 달 소득은 얼마인가요?
                </label>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  한 달에 실제로 통장에 입금되는 세후 소득을 입력해 주세요.
                  (소득이 없는 경우 0을 입력하시면 됩니다.)
                </p>

                <div className="pt-1">
                  <div
                    className={`flex items-center bg-white dark:bg-slate-800 rounded-2xl border-2 px-4 md:px-5 h-14 md:h-16 shadow-sm transition-all ${
                      incomeError
                        ? "border-red-500 ring-2 ring-red-200 dark:ring-red-900"
                        : "border-slate-300 dark:border-slate-600 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900"
                    }`}
                  >
                    <input
                      ref={incomeInputRef}
                      id="monthly-income"
                      name="monthlyIncome"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      placeholder="예: 300"
                      value={income}
                      onChange={handleIncomeChange}
                      onPaste={handleIncomePaste}
                      aria-invalid={incomeError ? "true" : "false"}
                      aria-describedby={
                        incomeError ? "income-error" : undefined
                      }
                      className="w-full text-lg md:text-2xl font-bold bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />
                    <span className="text-base md:text-xl font-bold text-slate-500 dark:text-slate-400 ml-2 whitespace-nowrap">
                      만원
                    </span>
                  </div>

                  {incomeError && (
                    <p
                      id="income-error"
                      role="alert"
                      className="text-sm md:text-base text-red-600 dark:text-red-400 font-semibold mt-2 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        error
                      </span>
                      <span>{incomeError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-slate-800" />

              {/* Question 2: Concern Selection */}
              <div className="space-y-3">
                <div
                  id="concern-question"
                  className="block text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-snug"
                >
                  <span className="text-blue-600 dark:text-blue-400 mr-2">Q2.</span>
                  은퇴 준비에서 가장 걱정되는 것은 무엇인가요?
                </div>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  가장 마음에 걸리는 항목 하나를 골라주시면, 해당 고민부터 먼저
                  점검해 드립니다.
                </p>

                <div
                  role="radiogroup"
                  aria-labelledby="concern-question"
                  className="space-y-3 pt-1"
                >
                  {RETIREMENT_CONCERNS.map((concern, idx) => {
                    const isSelected = selectedConcern === concern;
                    return (
                      <div
                        key={concern}
                        tabIndex={0}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleConcernSelect(concern)}
                        onKeyDown={(e) => handleConcernKeyDown(e, idx)}
                        className={`w-full p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 select-none ${
                          isSelected
                            ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-600 dark:border-blue-400 shadow-md ring-2 ring-blue-200 dark:ring-blue-900"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Radio Indicator */}
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? "border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-500"
                                : "border-slate-300 dark:border-slate-600 bg-transparent"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span
                            className={`text-base md:text-lg font-bold leading-normal ${
                              isSelected
                                ? "text-blue-950 dark:text-blue-100 font-extrabold"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {concern}
                          </span>
                        </div>

                        {isSelected && (
                          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[22px] flex-shrink-0">
                            check_circle
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {concernError && (
                  <p
                    id="concern-error"
                    role="alert"
                    className="text-sm md:text-base text-red-600 dark:text-red-400 font-semibold mt-2 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      error
                    </span>
                    <span>{concernError}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-14 md:h-[58px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-lg md:text-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>내 은퇴 준비 무료 점검하기</span>
                  <span className="material-symbols-outlined text-[24px]">
                    arrow_forward
                  </span>
                </button>
                <p className="text-center text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">
                  입력하신 정보는 상담 안내 화면으로 바로 안전하게 전달됩니다.
                </p>
              </div>
            </form>
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

            {/* 제목 */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              내 재무계획을 저장하고 관리해 보세요
            </h2>

            {/* 설명 */}
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto font-normal">
              로그인하면 재무설계안과 월별 자산 변화를 저장하고 언제든지 다시 확인할 수 있습니다.
            </p>

            {/* Google 계정으로 시작하기 단일 버튼 */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full sm:w-auto min-w-[280px] h-13 md:h-14 px-8 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-base md:text-lg flex items-center justify-center gap-3.5 cursor-pointer border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
              >
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
              </button>
            </div>

            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 pt-2">
              ※ 간편 점검은 로그인 없이 언제든지 무료로 이용하실 수 있습니다.
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
                href="#quick-check"
                className="hover:text-blue-600 transition-colors"
              >
                1분 점검
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
