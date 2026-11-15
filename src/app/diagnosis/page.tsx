"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { UserProfilePopover } from "@/components/user-profile-popover";

type StepType = "step1" | "step2" | "step3";

interface ChatMessage {
  id: string;
  sender: "user" | "gemini";
  time: string;
  text: string;
  details?: {
    basis: string[];
    comparison: {
      plan: string;
      saving: string;
      date: string;
      reduction: string;
    }[];
    suggestions: string[];
  };
}

export default function DiagnosisPage() {
  const { user, profile, signInWithGoogle, isLoading: isAuthLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<StepType>("step1");
  const [userConcern, setUserConcern] = useState<string>("");

  // Step 1 State (Supabase Table 1 & Table 2 가상 고객 데이터 연동)
  const [totalAsset, setTotalAsset] = useState("1,721,710,000");
  const [totalDebt, setTotalDebt] = useState("250,000,000");
  const [monthlyIncome, setMonthlyIncome] = useState("8,050,000");
  const [monthlyExpense, setMonthlyExpense] = useState("7,330,000");
  const [emergencyFund, setEmergencyFund] = useState("22,000,000");
  const [goalName, setGoalName] = useState("은퇴 후 생활비 마련");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDate, setGoalDate] = useState("");

  // Step 2 State (사용자 수정 대기: 수입/지출/변동 라벨 및 금액은 기존 유지)
  const [income2, setIncome2] = useState("2,900,000");
  const [fixedExpense, setFixedExpense] = useState("1,200,000");
  const [variableExpense, setVariableExpense] = useState("570,000");
  const [investment, setInvestment] = useState("700,000");
  const [assetChange, setAssetChange] = useState("+1,500,000");
  const [debtChange, setDebtChange] = useState("-1,000,000");

  // Retrieve user inputs from homepage (without URL query string)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedIncome = sessionStorage.getItem("financialDoctor_income");
        if (savedIncome !== null && savedIncome !== "" && savedIncome !== "3,000,000") {
          setMonthlyIncome(savedIncome);
        }
        const savedConcern = sessionStorage.getItem("financialDoctor_concern");
        if (savedConcern) {
          setUserConcern(savedConcern);
          if (savedConcern.includes("생활비")) {
            setGoalName("은퇴 후 생활비 마련");
          } else if (savedConcern.includes("연금")) {
            setGoalName("국민·퇴직연금 수령 준비");
          } else if (savedConcern.includes("대출")) {
            setGoalName("은퇴 전 대출 전액 상환");
          } else if (savedConcern.includes("자산")) {
            setGoalName("은퇴 자산 안정적 운용");
          }
        }
      } catch {
        // Safe fallback if sessionStorage is blocked
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Step 3 Chat State
  const [inputMessage, setInputMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "user",
      time: "오후 2:14",
      text: "이번 달 40만 원 더 저축하면 목표 달성 시기가 얼마나 빨라지나요?",
    },
    {
      id: "2",
      sender: "gemini",
      time: "오후 2:14",
      text: "이번 달부터 매월 저축액을 40만 원(연 480만 원) 늘리면, '내 집 마련' 목표 달성 시기가 약 8개월 빠릅니다. 🎯",
      details: {
        basis: [
          "기존 저축·투자액: 월 70만 원",
          "변경 후 저축·투자액: 월 110만 원 (▲ +40만 원)",
          "기대 수익률(가정): 연 4.0%",
          "목표 금액: 3억 원 / 현재 순자산: 8,650만 원",
          "복리 기준으로 누적 자산을 계산",
        ],
        comparison: [
          {
            plan: "기존 계획",
            saving: "70만 원",
            date: "2031년 12월",
            reduction: "-",
          },
          {
            plan: "변경 계획",
            saving: "110만 원",
            date: "2031년 4월",
            reduction: "✓ 약 8개월 단축",
          },
        ],
        suggestions: [
          "이번 달부터 저축액을 110만 2천 원으로 상향해보세요.",
          "IRP·연금저축 등 세제 혜택이 있는 상품으로 일부 전환을 검토해보세요.",
          "부동산 목표에 맞춰 주택청약, 전세대출 조건 등도 함께 점검해보세요.",
        ],
      },
    },
  ]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAiTyping) return;

    const currentTimeStr = new Date().toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      time: currentTimeStr,
      text: inputMessage.trim(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const queryText = inputMessage.trim();
    setInputMessage("");
    setIsAiTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          userContext: {
            assets: `총자산: ${totalAsset}원, 총부채: ${totalDebt}원, 월소득: ${monthlyIncome}원, 월지출: ${monthlyExpense}원, 비상자금: ${emergencyFund}원`,
            goal: `목표: ${goalName} (${goalAmount}원, 목표시점: ${goalDate})`,
            concern: userConcern || "은퇴 후 생활비 및 연금 절세 전략",
          },
        }),
      });

      if (!res.ok) {
        throw new Error("답변을 생성하지 못했습니다.");
      }

      const data = await res.json();
      const geminiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "gemini",
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "numeric",
          minute: "2-digit",
        }),
        text: data.text || "분석이 완료되었습니다.",
        details: data.details,
      };
      setMessages((prev) => [...prev, geminiMsg]);
    } catch (err: any) {
      console.error("Gemini 상담 에러:", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "gemini",
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "numeric",
          minute: "2-digit",
        }),
        text: "일시적인 오류로 AI 재무상담 응답을 불러오지 못했습니다. 잠시 후 다시 질문해 주세요.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F6FB] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#11192E] dark:bg-[#070D1E] text-white flex flex-col justify-between p-5 flex-shrink-0 z-20 shadow-xl">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md overflow-hidden flex-shrink-0">
              <img
                src="/images/doctor-icon.png"
                alt="재무주치의"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight">재무주치의</span>
              <span className="text-[10px] text-blue-200 font-semibold tracking-wider">
                은퇴 안심 케어
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1 text-sm">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span>홈</span>
            </Link>

            {/* 재무설계 (Active Root) */}
            <div className="pt-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white font-semibold bg-slate-800/80">
                <span className="material-symbols-outlined text-[20px] text-blue-400">
                  assignment
                </span>
                <span>재무설계</span>
              </div>

              {/* Sub-steps */}
              <div className="pl-6 pt-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep("step1")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentStep === "step1"
                      ? "bg-blue-600/90 text-white font-bold shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  STEP 01 설계안 등록
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("step2")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentStep === "step2"
                      ? "bg-blue-600/90 text-white font-bold shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  STEP 02 월별 변동 입력
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("step3")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentStep === "step3"
                      ? "bg-blue-600/90 text-white font-bold shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  STEP 03 AI 재무상담
                </button>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                query_stats
              </span>
              <span>내 재무현황</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
              <span>목표 관리</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                description
              </span>
              <span>리포트(PDF)</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>설정</span>
            </button>
          </nav>
        </div>

        {/* Gemini AI Card at bottom of sidebar */}
        <div
          onClick={() => setCurrentStep("step3")}
          className="rounded-xl bg-slate-800/90 border border-slate-700/80 p-3.5 cursor-pointer hover:bg-slate-800 transition-all hover:scale-[1.02] shadow-lg"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400 text-lg">✦</span>
            <span className="text-xs font-bold text-white">Gemini AI</span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium">재무상담</p>
          <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-1 font-semibold">
            <span>바로 질문하기</span>
            <span>→</span>
          </p>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-6 bg-white dark:bg-[#11192E] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>재무설계</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-800 dark:text-white font-bold">
              {currentStep === "step1" && "STEP 01 설계안 등록"}
              {currentStep === "step2" && "STEP 02 월별 변동 입력"}
              {currentStep === "step3" && "STEP 03 Gemini AI 재무상담"}
            </span>
          </div>

          {/* Right Header items: Theme toggle + Profile */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <UserProfilePopover />
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Google 로그인</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ================= STEP 01 ================= */}
          {currentStep === "step1" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Hero Banner */}
              <div className="rounded-2xl bg-[#0B2568] dark:bg-[#07194A] text-white p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
                <div className="space-y-1.5 z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-semibold mb-1">
                    <span>📋</span>
                    <span>은퇴 설계 기초 진단표</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    STEP 01 재무설계안 등록
                  </h2>
                  <p className="text-xs md:text-sm text-blue-100 max-w-2xl">
                    현재의 자산, 부채, 월 소득 및 지출 현황을 확인하고 은퇴 목표를 점검해 보세요.
                  </p>
                </div>
              </div>

              {/* Concern-based guidance banner */}
              {userConcern && (
                <div className="p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-100 flex items-start gap-3.5 shadow-sm">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[26px] flex-shrink-0 mt-0.5">
                    tips_and_updates
                  </span>
                  <div className="space-y-1.5 flex-1 text-xs md:text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-blue-900 dark:text-blue-200 text-sm md:text-base">
                        재무주치의 맞춤 안내
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold">
                        선택하신 고민: {userConcern}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {userConcern.includes("생활비") &&
                        "은퇴 후 생활비 확보를 위해 현재의 '월 지출'과 '비상자금'을 먼저 확인해 주세요. 입력하신 소득과 비교하여 은퇴 후 희망 생활비 마련 방안을 안내해 드립니다."}
                      {userConcern.includes("연금") &&
                        "국민연금과 퇴직연금 수령 시점 전까지의 자금 흐름을 파악하기 위해, 현재 '월 소득'과 '보유 순자산'을 먼저 점검해 보세요."}
                      {userConcern.includes("대출") &&
                        "은퇴 전 부채 부담을 덜어내기 위해 현재 '총 부채'와 '월 소득 대비 상환 가능액'을 우선적으로 확인해 주세요."}
                      {userConcern.includes("자산") &&
                        "모아둔 자산의 안정적인 노후 운용을 위해 현재의 '총 자산'과 '목표 금액'을 먼저 점검하고 포트폴리오를 설계해 보세요."}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      ※ 아래 양식에 추가 정보를 입력하시면 맞춤형 자산·부채 분석을 이어가실 수 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1 Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Form: 기본 재무정보 입력 */}
                <div className="lg:col-span-8 bg-white dark:bg-[#11192E] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    기본 재무정보 입력
                  </h3>

                  {/* 자산 / 부채 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        <span>💰</span>
                        <span>자산 현황</span>
                      </label>
                      <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-400 mr-2 font-medium">
                          총 자산
                        </span>
                        <input
                          type="text"
                          value={totalAsset}
                          onChange={(e) => setTotalAsset(e.target.value)}
                          className="w-full text-right text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 ml-2">원</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        <span>💳</span>
                        <span>부채 현황</span>
                      </label>
                      <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-400 mr-2 font-medium">
                          총 부채
                        </span>
                        <input
                          type="text"
                          value={totalDebt}
                          onChange={(e) => setTotalDebt(e.target.value)}
                          className="w-full text-right text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 ml-2">원</span>
                      </div>
                    </div>
                  </div>

                  {/* 월 소득 및 지출 */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>📊</span>
                      <span>월 소득 및 지출</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-400 mr-2 font-medium">
                          월 소득(세후)
                        </span>
                        <input
                          type="text"
                          value={monthlyIncome}
                          onChange={(e) => setMonthlyIncome(e.target.value)}
                          className="w-full text-right text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 ml-2">원</span>
                      </div>
                      <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-400 mr-2 font-medium">
                          월 지출(전체)
                        </span>
                        <input
                          type="text"
                          value={monthlyExpense}
                          onChange={(e) => setMonthlyExpense(e.target.value)}
                          className="w-full text-right text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 ml-2">원</span>
                      </div>
                    </div>
                  </div>

                  {/* 비상자금 설정 */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>🛡️</span>
                      <span>비상자금 설정</span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-full">
                        <span className="text-xs text-slate-400 mr-2 font-medium">
                          목표 비상자금
                        </span>
                        <input
                          type="text"
                          value={emergencyFund}
                          onChange={(e) => setEmergencyFund(e.target.value)}
                          className="w-full text-right text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 ml-2">원</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                        (월 지출의 약 3.0개월분)
                      </span>
                    </div>
                  </div>

                  {/* 재무 목표 설정 */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>🎯</span>
                      <span>재무 목표 설정</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          목표 이름 ⓘ
                        </span>
                        <input
                          type="text"
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          목표 금액 ⓘ
                        </span>
                        <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                          <input
                            type="text"
                            value={goalAmount}
                            onChange={(e) => setGoalAmount(e.target.value)}
                            className="w-full text-right text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                          />
                          <span className="text-xs text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          목표 날짜 ⓘ
                        </span>
                        <input
                          type="date"
                          value={goalDate}
                          onChange={(e) => setGoalDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href="/"
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      홈으로
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("step2")}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95"
                    >
                      <span>저장하고 다음 단계로</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* Right Summary Column */}
                <div className="lg:col-span-4 space-y-4">
                  {/* 입력 요약 */}
                  <div className="bg-white dark:bg-[#11192E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                      입력 요약
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>🏠</span> 총 자산
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          17억 2,171만원
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>💳</span> 총 부채
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          2억 5,000만원
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>💰</span> 순자산
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          14억 7,171만원
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 월 현금흐름 */}
                  <div className="bg-white dark:bg-[#11192E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                      월 현금흐름
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>💵</span> 월 소득
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          805만원
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>🧾</span> 월 지출
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          733만원
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                        <div>
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                            월 저축가능액
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            (저축률 8.9%)
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                          72만원
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 목표 요약 */}
                  <div className="bg-white dark:bg-[#11192E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                      목표 요약
                    </h4>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-lg">
                        🎯
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {goalName || "은퇴 재무목표"}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {goalAmount && goalDate
                            ? `${parseInt(goalAmount.replace(/,/g, "") || "0", 10) >= 100000000 ? `${(parseInt(goalAmount.replace(/,/g, ""), 10) / 100000000).toFixed(1)}억 원` : `${goalAmount}원`} • ${goalDate}`
                            : "목표 금액 및 일정 설정 대기 중"}
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold mt-0.5">
                          {goalDate ? "설정된 목표 일정 반영" : "금액과 달성 시점을 직접 입력해 보세요"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 02 ================= */}
          {currentStep === "step2" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Hero Banner */}
              <div className="rounded-2xl bg-[#0B2568] dark:bg-[#07194A] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="space-y-2 z-10">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    STEP 02 월별 변동 입력 + 자동 분석
                  </h2>
                  <p className="text-xs md:text-sm text-blue-100 max-w-xl">
                    매월의 수입, 지출, 자산·부채 변동을 입력하여 설계안 대비
                    달성률과 순자산 추이를 자동으로 분석해요.
                  </p>
                </div>

                {/* Month Selector */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 z-10 flex-shrink-0">
                  <button
                    type="button"
                    className="text-white hover:text-blue-300 text-xs"
                  >
                    ‹
                  </button>
                  <span className="text-xs font-bold text-white px-2">
                    2026년 10월 ▾
                  </span>
                  <button
                    type="button"
                    className="text-white hover:text-blue-300 text-xs"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Step 2 Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Form: 2026년 10월 재무 입력 (입력값 및 괄호 설명은 사용자 수정 대기 유지) */}
                <div className="lg:col-span-5 bg-white dark:bg-[#11192E] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                    2026년 10월 재무 입력
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span>월 수입 (급여, 기타소득)</span>
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">💵</span>
                        <input
                          type="text"
                          value={income2}
                          onChange={(e) => setIncome2(e.target.value)}
                          className="w-full text-right font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span>고정지출 (주거, 통신, 보험 등)</span>
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">🏠</span>
                        <input
                          type="text"
                          value={fixedExpense}
                          onChange={(e) => setFixedExpense(e.target.value)}
                          className="w-full text-right font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span>변동지출 (식비, 교통, 여가 등)</span>
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">🍔</span>
                        <input
                          type="text"
                          value={variableExpense}
                          onChange={(e) => setVariableExpense(e.target.value)}
                          className="w-full text-right font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span>투자/저축 (적립금, 펀드, 주식 등)</span>
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">📈</span>
                        <input
                          type="text"
                          value={investment}
                          onChange={(e) => setInvestment(e.target.value)}
                          className="w-full text-right font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span>자산 변화 (매입/매도·평가변동)</span>
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">✨</span>
                        <input
                          type="text"
                          value={assetChange}
                          onChange={(e) => setAssetChange(e.target.value)}
                          className="w-full text-right font-bold bg-transparent text-blue-600 dark:text-blue-400 focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span>부채 변화 (대출상환/신규)</span>
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">💳</span>
                        <input
                          type="text"
                          value={debtChange}
                          onChange={(e) => setDebtChange(e.target.value)}
                          className="w-full text-right font-bold bg-transparent text-emerald-600 dark:text-emerald-400 focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-3 rounded-xl bg-[#1B3574] hover:bg-[#142857] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>📊</span>
                    <span>분석하기</span>
                  </button>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("step1")}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      이전 단계
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("step3")}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <span>AI 상담 가기</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* Right Analysis Column: 재무설계 계획안 vs 실행 후 비교 분석 */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Top 3 Metric Cards: 실행 후 핵심 지표 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] text-slate-500 font-medium">
                        실행 후 순자산
                      </div>
                      <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                        약 13.93억
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-1">
                        현재 약 14.72억 (부채 0원 달성)
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] text-slate-500 font-medium">
                        월 지출 절감액
                      </div>
                      <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                        ▼ -185만 원
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        대출 원리금 0원 영구 해소
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] text-slate-500 font-medium">
                        은퇴 후 월 수입
                      </div>
                      <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
                        월 300만 원
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                        IRP 250만 + 연금저축 50만
                      </div>
                    </div>
                  </div>

                  {/* 재무설계 전·후 핵심 구조 비교 시각화 카드 */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                          재무설계 실행 전·후 핵심 구조 비교
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          대출 상환 및 연금 구조화에 따른 현금흐름과 자산 건전성 개선
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        부채 전액 상환 플랜
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {/* 현재 (퇴직 전/유지) */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            현재 상태 (퇴직 전/현상태 유지)
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            기존 계획
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">순자산</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">약 14.72억 원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">총 부채</span>
                            <span className="font-bold text-red-600 dark:text-red-400">2억 5,000만 원 (연 4%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">월 지출</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">733만 원 (원리금 185만 포함)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">은퇴 후 수입</span>
                            <span className="font-bold text-amber-600">45만 원 (월 적자 −592만)</span>
                          </div>
                        </div>
                      </div>

                      {/* 실행 후 (재무설계 계획안) */}
                      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2.5">
                        <div className="flex justify-between items-center pb-1.5 border-b border-blue-200 dark:border-blue-900">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                            재무설계 실행 후 (개선 계획안)
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ 실행 목표
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">순자산</span>
                            <span className="font-bold text-blue-900 dark:text-blue-200">약 13.93억 원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">총 부채</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">0원 (전액 상환 완료)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">월 지출</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">452만 원 (▼ 185만 감소)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">은퇴 후 수입</span>
                            <span className="font-extrabold text-blue-700 dark:text-blue-300">월 300만 원 (연금 확충)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 재무설계 실행 전·후 상세 비교 테이블 (Supabase 실행후 테이블 기반) */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                        계획안 vs 실행 후 비교표 (Supabase 실데이터)
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        단위: 원, 만 원, 억 원
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/60 dark:bg-slate-900/60">
                            <th className="py-2.5 px-3">항목</th>
                            <th className="py-2.5 px-3">현재 상태</th>
                            <th className="py-2.5 px-3">실행 후 계획안</th>
                            <th className="py-2.5 px-3">분석 및 비고</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              현금성자산
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">2억</td>
                            <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                              약 1,700만원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              상환·결혼자금·퇴직소득세 차감
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              주식·ETF
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">약 4,170만원</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                              약 4,170만원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              ISA 계좌 이전 (비과세 절세)
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              퇴직급여·IRP
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">4억</td>
                            <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                              2.5억
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              대출 일부 상환 후 잔여 연금 전환
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              연금저축
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">8천만원</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                              약 8,400만원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              안정형 배분으로 변동성 관리
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              아파트
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">10억</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                              10억
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              자산 가치 유지 (주택연금 후보)
                            </td>
                          </tr>
                          <tr className="bg-red-50/40 dark:bg-red-950/20">
                            <td className="py-2.5 px-3 font-bold text-red-700 dark:text-red-300">
                              대출 (부채)
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-red-600 dark:text-red-400">2.5억</td>
                            <td className="py-2.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                              0 (전액 상환)
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                              ✓ 월 원리금 185만 원 영구 소멸
                            </td>
                          </tr>
                          <tr className="bg-blue-50/50 dark:bg-blue-950/30">
                            <td className="py-2.5 px-3 font-bold text-blue-900 dark:text-blue-200">
                              순자산
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">약 14.72억</td>
                            <td className="py-2.5 px-3 font-extrabold text-blue-700 dark:text-blue-300">
                              약 13.93억
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                              부채 리스크 완전 제거 후 안정 확보
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              월 수입 (은퇴 후)
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">—</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              300만원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              IRP 250만 + 연금저축 50만 (64세+ 국민연금 85만)
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              월 지출
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              733만 원 (퇴직 후 637만)
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              452만 원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                              대출 상환으로 원리금 185만 원 감소
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 03 ================= */}
          {currentStep === "step3" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Hero Banner */}
              <div className="rounded-2xl bg-[#0B2568] dark:bg-[#07194A] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="space-y-2 z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                      STEP 03 Gemini AI 재무상담
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-semibold">
                      ✦ Powered by Gemini
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-blue-100 max-w-xl">
                    내 재무상태와 목표를 바탕으로 Gemini가 맞춤형 재무 조언을
                    제공해요.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 z-10 flex-shrink-0 text-right">
                  <span className="text-[11px] font-bold text-blue-200 block">
                    가상 금융정보
                  </span>
                  <span className="text-[10px] text-blue-300">
                    본 화면의 모든 수치와 계좌정보는 예시로 생성된 가상
                    데이터입니다.
                  </span>
                </div>
              </div>

              {/* Step 3 Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: 현재 재무상태 요약 */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                        현재 재무상태 요약 (가상 금융정보)
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        기준: 2026.11.30
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] text-slate-500">
                          🏠 총 자산
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                          1억 2,000만원
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] text-slate-500">
                          💳 총 부채
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                          3,500만원
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800">
                        <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">
                          💰 순자산
                        </div>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                          8,650만원
                        </div>
                        <div className="text-[8px] text-emerald-600 mt-0.5">
                          (+1.8%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 주요 근거 데이터 & 목표 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                      <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>📊</span> 주요 근거 데이터
                      </h5>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">월 소득 (세후)</span>
                          <span className="font-semibold">290만원</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">월 지출</span>
                          <span className="font-semibold">197만원</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">월 저축·투자액</span>
                          <span className="font-semibold">70만원</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400">저축률</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            34.5% (목표 30% ↑)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                      <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="19"
                            stroke="rgba(100,116,139,0.2)"
                            strokeWidth="5"
                            fill="transparent"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="19"
                            stroke="#10B981"
                            strokeWidth="5"
                            strokeDasharray={2 * Math.PI * 19}
                            strokeDashoffset={2 * Math.PI * 19 * (1 - 0.72)}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-bold text-emerald-600">
                          72%
                        </span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-xs font-bold text-slate-800 dark:text-white block">
                          내 집 마련
                        </span>
                        <span className="text-slate-500 block">3억 원</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          2031년 12월
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("step2")}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      ← STEP 02로 이동
                    </button>
                    <Link
                      href="/"
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      홈으로 돌아가기
                    </Link>
                  </div>
                </div>

                {/* Right Column: AI Chat Panel */}
                <div className="lg:col-span-7 bg-white dark:bg-[#11192E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[650px] overflow-hidden">
                  {/* Chat messages scroll area */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          <div className="flex items-end gap-2 max-w-[85%]">
                            <span className="text-[10px] text-slate-400">
                              {msg.time}
                            </span>
                            <div className="px-4 py-3 rounded-2xl rounded-tr-none bg-blue-600 text-white text-xs font-medium shadow-sm">
                              {msg.text}
                            </div>
                            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                              👤
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 max-w-[95%]">
                            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                              ✦
                            </div>
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                  Gemini
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {msg.time}
                                </span>
                              </div>

                              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-100 space-y-3 leading-relaxed">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {msg.text}
                                </p>

                                {msg.details && (
                                  <>
                                    {/* Split card */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                          계산 근거 (가정)
                                        </div>
                                        <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-3">
                                          {msg.details.basis.map((b, i) => (
                                            <li key={i}>{b}</li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                                        <div className="text-[11px] font-bold text-blue-900 dark:text-blue-300 mb-1.5">
                                          시나리오 비교
                                        </div>
                                        <div className="space-y-1 text-[10px]">
                                          {msg.details.comparison.map(
                                            (c, i) => (
                                              <div
                                                key={i}
                                                className="flex justify-between items-center py-0.5 border-b border-blue-100 dark:border-blue-900/60 last:border-none"
                                              >
                                                <span className="text-slate-500">
                                                  {c.plan} ({c.saving})
                                                </span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                  {c.date}{" "}
                                                  <span className="text-emerald-600 font-semibold">
                                                    {c.reduction}
                                                  </span>
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* 다음 행동 제안 */}
                                    <div className="pt-2">
                                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                                        <span>💡</span> 다음 행동 제안
                                      </div>
                                      <div className="grid grid-cols-1 gap-1.5">
                                        {msg.details.suggestions.map(
                                          (s, i) => (
                                            <div
                                              key={i}
                                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] flex items-center gap-2"
                                            >
                                              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                                                {i + 1}
                                              </span>
                                              <span className="text-slate-700 dark:text-slate-300">
                                                {s}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isAiTyping && (
                      <div className="flex items-start gap-3 max-w-[95%] animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                          ✦
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-white">
                            Gemini 재무주치의
                          </span>
                          <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                            <span className="ml-1 text-[11px] font-medium text-slate-500">
                              고객님의 재무 데이터와 세법 시나리오를 분석하고 있습니다...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        attach_file
                      </span>
                    </button>
                    <input
                      type="text"
                      value={inputMessage}
                      disabled={isAiTyping}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                      }}
                      placeholder={
                        isAiTyping
                          ? "Gemini가 분석 답변을 작성 중입니다..."
                          : "궁금한 내용을 입력하세요. (예: 대출 상환 전략, 세금 절세 방법 등)"
                      }
                      className="flex-1 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isAiTyping || !inputMessage.trim()}
                      className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white flex items-center justify-center transition-all shadow active:scale-95 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        send
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
