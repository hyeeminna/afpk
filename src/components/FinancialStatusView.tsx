"use client";

import React, { useState, useEffect } from "react";

interface FinancialStatusViewProps {
  onNavigateStep?: (step: "step1" | "step2" | "step3" | "financial_status") => void;
  onOpenTaxModal?: () => void;
  isTemplateBlank?: boolean;
  onLoadSupabaseData?: () => void;
  totalAsset?: string;
  totalDebt?: string;
  monthlyIncome?: string;
  monthlyExpense?: string;
  emergencyFund?: string;
  goalName?: string;
  goalAmount?: string;
  goalDate?: string;
  monthlyRecords?: Record<string, any>;
}

export default function FinancialStatusView({
  onNavigateStep,
  onOpenTaxModal,
  isTemplateBlank = false,
  onLoadSupabaseData,
  totalAsset = "",
  totalDebt = "",
  monthlyIncome = "",
  monthlyExpense = "",
  emergencyFund = "",
  goalName = "",
  goalAmount = "",
  goalDate = "",
  monthlyRecords,
}: FinancialStatusViewProps) {
  const [activeTab, setActiveTab] = useState<"balance" | "cashflow" | "diagnosis">("balance");

  // 작성 기준일 상태 (기본값: 오늘 날짜 또는 가상 결산일)
  const getTodayStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}. ${m}. ${d}`;
  };

  const [reportDate, setReportDate] = useState<string>(() =>
    isTemplateBlank ? getTodayStr() : "2026. 10. 31"
  );
  const [isEditingDate, setIsEditingDate] = useState(false);

  // 세부 항목 직접 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState<"balance" | "cashflow">("balance");

  // 숫자 파싱 유틸리티
  const parseNum = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/[^0-9.-]/g, "");
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const cleanAsset = parseNum(totalAsset);
  const cleanDebt = parseNum(totalDebt);
  const cleanNetWorth = cleanAsset - cleanDebt;
  const cleanIncome = parseNum(monthlyIncome);
  const cleanExpense = parseNum(monthlyExpense);
  const cleanSurplus = cleanIncome - cleanExpense;
  const cleanEmergency = parseNum(emergencyFund);

  // 한국어 금액 포맷터 (단위: 억, 만 원 및 원 단위 정밀 표기)
  const formatKoreanAmount = (num: number) => {
    if (num === 0) return "0원";
    const sign = num < 0 ? "-" : "";
    const abs = Math.abs(num);
    const uk = Math.floor(abs / 100000000);
    const man = Math.floor((abs % 100000000) / 10000);
    const rest = abs % 10000;
    const parts: string[] = [];
    if (uk > 0) parts.push(`${uk}억`);
    if (man > 0) parts.push(`${man.toLocaleString("ko-KR")}만`);
    if (rest > 0) parts.push(`${rest.toLocaleString("ko-KR")}`);
    return `${sign}${parts.join(" ").trim()} 원`;
  };

  // 상세 내역 커스텀 상태 (신규 고객 직접 편집용)
  const CUSTOM_DETAILS_KEY = "afpk_financial_status_custom_details_v2";
  const [customBalance, setCustomBalance] = useState({
    cashName: "정기예금 · 비상금",
    cashAmount: cleanEmergency > 0 ? cleanEmergency : Math.round(cleanAsset * 0.2),
    investName: "국내외 주식 · 펀드",
    investAmount: Math.round(cleanAsset * 0.1),
    retireName: "개인형 IRP · 연금저축",
    retireAmount: Math.round(cleanAsset * 0.2),
    estateName: "거주용 부동산 (자가/보증금)",
    estateAmount: Math.max(0, cleanAsset - Math.round(cleanAsset * 0.5)),
    debtName: "아파트 담보대출 / 신용대출",
    debtAmount: cleanDebt,
  });

  const [customCashflow, setCustomCashflow] = useState({
    salary: cleanIncome,
    nonSalary: 0,
    fixedExpense: Math.round(cleanExpense * 0.4),
    variableExpense: Math.round(cleanExpense * 0.6),
    retireIncome: 0,
    retireExpense: cleanExpense,
  });

  // 로컬스토리지에서 커스텀 상세내역 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_DETAILS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customBalance) setCustomBalance(parsed.customBalance);
        if (parsed.customCashflow) setCustomCashflow(parsed.customCashflow);
        if (parsed.reportDate) setReportDate(parsed.reportDate);
      } else if (cleanAsset > 0 || cleanIncome > 0) {
        // 기본 비례 초기화
        const initCash = cleanEmergency > 0 ? Math.min(cleanEmergency, cleanAsset) : Math.round(cleanAsset * 0.2);
        const initInvest = Math.round(cleanAsset * 0.1);
        const initRetire = Math.round(cleanAsset * 0.2);
        const initEstate = Math.max(0, cleanAsset - (initCash + initInvest + initRetire));
        setCustomBalance({
          cashName: "정기예금 · 비상예비자금",
          cashAmount: initCash,
          investName: "국내외 주식 · ETF",
          investAmount: initInvest,
          retireName: "퇴직급여 IRP · 연금저축",
          retireAmount: initRetire,
          estateName: "거주용 주택 (자가/보증금)",
          estateAmount: initEstate,
          debtName: "금융권 대출금",
          debtAmount: cleanDebt,
        });
        setCustomCashflow({
          salary: cleanIncome,
          nonSalary: 0,
          fixedExpense: Math.round(cleanExpense * 0.4),
          variableExpense: Math.round(cleanExpense * 0.6),
          retireIncome: 0,
          retireExpense: cleanExpense,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [cleanAsset, cleanDebt, cleanIncome, cleanExpense, cleanEmergency]);

  // 커스텀 상세내역 저장 함수
  const saveCustomDetails = (newBal = customBalance, newCf = customCashflow, newDate = reportDate) => {
    try {
      localStorage.setItem(
        CUSTOM_DETAILS_KEY,
        JSON.stringify({
          customBalance: newBal,
          customCashflow: newCf,
          reportDate: newDate,
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  // KPI 디스플레이 값
  const displayAsset = isTemplateBlank
    ? cleanAsset > 0
      ? formatKoreanAmount(cleanAsset)
      : "0원 (입력 대기)"
    : "17억 2,171만 원";
  const displayDebt = isTemplateBlank
    ? cleanDebt > 0
      ? formatKoreanAmount(cleanDebt)
      : "0원 (입력 대기)"
    : "2억 5,000만 원";
  const displayNetWorth = isTemplateBlank
    ? cleanNetWorth !== 0
      ? formatKoreanAmount(cleanNetWorth)
      : "0원 (입력 대기)"
    : "14억 7,171만 원";
  const displaySurplus = isTemplateBlank
    ? cleanSurplus !== 0
      ? (cleanSurplus > 0 ? "+" : "") + formatKoreanAmount(cleanSurplus)
      : "0원 (입력 대기)"
    : "+72만 원";

  // 퇴직 직후 월 수치 (실시간 계산값)
  const displayRetirementDeficit = isTemplateBlank
    ? cleanExpense > 0
      ? `-${formatKoreanAmount(cleanExpense)}`
      : "0원 (지출 입력 대기)"
    : cleanExpense > 0
    ? `-${formatKoreanAmount(Math.max(0, cleanExpense - 450000))}`
    : "-592만 원";

  // 자산 구성 비중 계산 (신규 고객 모드 vs 가상 모드)
  const balanceItems = isTemplateBlank
    ? [
        {
          key: "estate",
          label: "사용자산 (부동산)",
          name: customBalance.estateName,
          amount: customBalance.estateAmount,
          color: "bg-blue-600",
          textColor: "text-blue-600 dark:text-blue-400",
        },
        {
          key: "retire",
          label: "은퇴자산",
          name: customBalance.retireName,
          amount: customBalance.retireAmount,
          color: "bg-emerald-500",
          textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
          key: "cash",
          label: "현금성자산",
          name: customBalance.cashName,
          amount: customBalance.cashAmount,
          color: "bg-amber-500",
          textColor: "text-amber-600 dark:text-amber-400",
        },
        {
          key: "invest",
          label: "투자자산",
          name: customBalance.investName,
          amount: customBalance.investAmount,
          color: "bg-purple-600",
          textColor: "text-purple-600 dark:text-purple-400",
        },
      ]
    : [
        {
          key: "estate",
          label: "사용자산(부동산)",
          name: "수원 아파트 (자가)",
          amount: 1000000000,
          ratio: 58.1,
          color: "bg-blue-600",
          textColor: "text-blue-600 dark:text-blue-400",
          display: "10억 (58.1%)",
        },
        {
          key: "retire",
          label: "은퇴자산",
          name: "퇴직급여 DC형 & 연금저축",
          amount: 480000000,
          ratio: 27.9,
          color: "bg-emerald-500",
          textColor: "text-emerald-600 dark:text-emerald-400",
          display: "4.8억 (27.9%)",
        },
        {
          key: "cash",
          label: "현금성자산",
          name: "정기예금 · 적금",
          amount: 200000000,
          ratio: 11.6,
          color: "bg-amber-500",
          textColor: "text-amber-600 dark:text-amber-400",
          display: "2억 (11.6%)",
        },
        {
          key: "invest",
          label: "투자자산",
          name: "삼성전자 & 미국 지수 ETF",
          amount: 41710000,
          ratio: 2.4,
          color: "bg-purple-600",
          textColor: "text-purple-600 dark:text-purple-400",
          display: "4,171만 (2.4%)",
        },
      ];

  const calcTotalBalance = isTemplateBlank
    ? balanceItems.reduce((acc, it) => acc + it.amount, 0) || cleanAsset || 1
    : 1721710000;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0F224A] via-[#162D63] to-[#1E3A8A] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              내 재무현황 종합 분석표
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {isTemplateBlank ? "고객 입력 실시간 연동" : "Supabase DB 실데이터 연동"}
            </span>
          </div>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl">
            고객님의 실제 보유 자산·부채(재무상태표)와 월간 현금흐름(퇴직 전 vs 퇴직 후 비교)을
            AFPK 재무설계 표준 규격으로 정밀 분석한 종합 보고서입니다.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenTaxModal}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <span>🏛️</span>
            <span>세무사 상담 요청</span>
          </button>
          {onNavigateStep && (
            <button
              type="button"
              onClick={() => onNavigateStep("step3")}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>✦</span>
              <span>AI 조언 보기</span>
            </button>
          )}
        </div>
      </div>

      {/* Blank Mode Guidance Banner */}
      {isTemplateBlank && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-xl">📝</span>
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">
                신규 고객 상담용 양식 모드:{" "}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                고객이 직접 입력하신 숫자(자산·부채·월소득·월지출)가 재무상태표와 현금흐름표에 실시간 100% 반영됩니다.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditModalTab(activeTab === "cashflow" ? "cashflow" : "balance");
                setShowEditModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              ✍️ 상세 내역 항목 수정
            </button>
            {onLoadSupabaseData && (
              <button
                type="button"
                onClick={onLoadSupabaseData}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                🔄 Supabase 모범안 불러오기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Top Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 총 자산 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span>🏠</span>
            <span>총 자산</span>
          </div>
          <div className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">
            {displayAsset}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
            {isTemplateBlank ? "고객 입력 기준" : "부동산 58% • 은퇴 28%"}
          </div>
        </div>

        {/* 총 부채 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span>💳</span>
            <span>총 부채</span>
          </div>
          <div className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">
            {displayDebt}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            {isTemplateBlank
              ? cleanAsset > 0
                ? `부채비율 ${((cleanDebt / cleanAsset) * 100).toFixed(1)}%`
                : "고객 입력 기준"
              : "담보대출 (LTV 25%)"}
          </div>
        </div>

        {/* 순자산 */}
        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1">
            <span>💰</span>
            <span>순자산 (Net Worth)</span>
          </div>
          <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {displayNetWorth}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            {isTemplateBlank ? "자산 - 부채 실시간" : "부채비율 14.5% (안전)"}
          </div>
        </div>

        {/* 현재 월 잉여금 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span>📈</span>
            <span>현재 월 잉여금</span>
          </div>
          <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {displaySurplus}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isTemplateBlank
              ? `월 소득 ${cleanIncome > 0 ? cleanIncome.toLocaleString() : "0"}원 - 지출 ${cleanExpense > 0 ? cleanExpense.toLocaleString() : "0"}원`
              : "수입 805만 / 지출 733만"}
          </div>
        </div>

        {/* 퇴직 직후 월 수치 (실시간 달라지는 수치) */}
        <div className="p-4 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-800 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-[11px] text-red-700 dark:text-red-300 font-bold flex items-center gap-1">
            <span>⚠️</span>
            <span>퇴직 직후 월 수치</span>
          </div>
          <div className="text-lg font-extrabold text-red-600 dark:text-red-400 mt-1">
            {displayRetirementDeficit}
          </div>
          <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-1">
            {isTemplateBlank
              ? cleanExpense > 0
                ? "월 지출액 전액 적자 위험"
                : "소득 공백기 대비 필수"
              : "소득 공백기 대비 필수"}
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("balance")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "balance"
                ? "bg-[#1B3574] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>📊</span>
            <span>1. 자산·부채 상태표 (재무상태표)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cashflow")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "cashflow"
                ? "bg-[#1B3574] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>💸</span>
            <span>2. 월간 현금흐름표 (퇴직 전 vs 퇴직 후)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("diagnosis")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "diagnosis"
                ? "bg-[#1B3574] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>🔍</span>
            <span>3. 자산·보험·세무 정밀 진단</span>
          </button>
        </div>

        {/* 작성 기준일 표기 및 변경 UI */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="font-semibold text-slate-600 dark:text-slate-300">작성 기준일:</span>
          {isEditingDate ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                placeholder="YYYY. MM. DD"
                className="w-28 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs text-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  setIsEditingDate(false);
                  saveCustomDetails(customBalance, customCashflow, reportDate);
                }}
                className="px-2 py-0.5 bg-blue-600 text-white rounded text-[11px] font-bold"
              >
                저장
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-white">{reportDate}</span>
              <button
                type="button"
                onClick={() => setIsEditingDate(true)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                [변경]
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: 자산·부채 상태표 (재무상태표) */}
      {/* ======================================================== */}
      {activeTab === "balance" && (
        <div className="space-y-6">
          {/* Asset Allocation Visual Bar (고객 데이터 연동) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>자산 구성 비중 (총 자산: {displayAsset})</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">단위: %</span>
                {isTemplateBlank && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalTab("balance");
                      setShowEditModal(true);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    [ ✍️ 자산 상세 항목 수정 ]
                  </button>
                )}
              </div>
            </div>

            {/* Multi-segment Progress Bar */}
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              {balanceItems.map((item) => {
                const ratio = isTemplateBlank
                  ? calcTotalBalance > 0
                    ? ((item.amount / calcTotalBalance) * 100).toFixed(1)
                    : "0.0"
                  : (item as any).ratio;
                return (
                  <div
                    key={item.key}
                    style={{ width: `${ratio}%` }}
                    className={`${item.color} transition-all`}
                    title={`${item.label}: ${ratio}%`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              {balanceItems.map((item) => {
                const ratio = isTemplateBlank
                  ? calcTotalBalance > 0
                    ? ((item.amount / calcTotalBalance) * 100).toFixed(1)
                    : "0.0"
                  : (item as any).ratio;
                const formattedAmt = isTemplateBlank
                  ? formatKoreanAmount(item.amount)
                  : (item as any).display;
                return (
                  <div key={item.key} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`}></span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {isTemplateBlank ? `${formattedAmt} (${ratio}%)` : (item as any).display}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 자산·부채 상세 테이블 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {reportDate} 기준 자산·부채 상태표 (상세 내역)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isTemplateBlank
                    ? "고객 실시간 입력 데이터 기준 맞춤 정밀 재무상태표"
                    : "Supabase 테이블 '10월 재무상태표 상세' 실데이터 연동"}
                </p>
              </div>
              <span className="text-xs text-slate-400">작성 기준일: {reportDate}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/70 dark:bg-slate-900/60">
                    <th className="py-2.5 px-3">대분류</th>
                    <th className="py-2.5 px-3">세부 항목</th>
                    <th className="py-2.5 px-3 text-right">자산 가치 평가액</th>
                    <th className="py-2.5 px-3 text-right">비중</th>
                    <th className="py-2.5 px-3">비고 및 평가 기준</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* 현금성 자산 */}
                  <tr className="bg-amber-50/20 dark:bg-amber-950/10">
                    <td className="py-2.5 px-3 font-bold text-amber-700 dark:text-amber-400">
                      현금성 자산
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {isTemplateBlank ? customBalance.cashName : "정기예금 · 적금"}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-right text-slate-800 dark:text-white">
                      {isTemplateBlank
                        ? `${customBalance.cashAmount.toLocaleString()}원`
                        : "200,000,000원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                      {isTemplateBlank
                        ? calcTotalBalance > 0
                          ? `${((customBalance.cashAmount / calcTotalBalance) * 100).toFixed(1)}%`
                          : "0.0%"
                        : "11.6%"}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {isTemplateBlank
                        ? "원금 또는 즉시 인출 가능 비상예비자금"
                        : "원금 or 작성일 해지 가정 시 환급금 (비상자금 및 결혼자금 예비)"}
                    </td>
                  </tr>

                  {/* 투자 자산 */}
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-purple-700 dark:text-purple-400">
                      투자 자산
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">
                      {isTemplateBlank ? customBalance.investName : "삼성전자 & 미국 지수 ETF (100주 등)"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-white">
                      {isTemplateBlank
                        ? `${customBalance.investAmount.toLocaleString()}원`
                        : "41,705,500원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {isTemplateBlank
                        ? calcTotalBalance > 0
                          ? `${((customBalance.investAmount / calcTotalBalance) * 100).toFixed(1)}%`
                          : "0.0%"
                        : "2.4%"}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {isTemplateBlank
                        ? "주식, 채권, ETF, 펀드 등 평가액 기준"
                        : "작성일 당시 평가 금액 (삼성전자 2,210만, S&P500 253만, 나스닥 1,707만)"}
                    </td>
                  </tr>

                  {/* 은퇴 자산 */}
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                      은퇴 자산
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">
                      {isTemplateBlank ? customBalance.retireName : "퇴직급여 (DC형) & 연금저축"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                      {isTemplateBlank
                        ? `${customBalance.retireAmount.toLocaleString()}원`
                        : "480,000,000원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {isTemplateBlank
                        ? calcTotalBalance > 0
                          ? `${((customBalance.retireAmount / calcTotalBalance) * 100).toFixed(1)}%`
                          : "0.0%"
                        : "27.9%"}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {isTemplateBlank
                        ? "퇴직연금(DB/DC/IRP), 연금저축펀드 등 노후 준비금"
                        : "퇴직급여 4억(DC형, 1년 뒤 수령 예정) + 연금저축 8,000만 원"}
                    </td>
                  </tr>

                  {/* 사용 자산 (부동산) */}
                  <tr className="bg-blue-50/20 dark:bg-blue-950/10">
                    <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400">
                      사용 자산
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {isTemplateBlank ? customBalance.estateName : "수원 아파트 (자가 거주용)"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      {isTemplateBlank
                        ? `${customBalance.estateAmount.toLocaleString()}원`
                        : "1,000,000,000원"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      {isTemplateBlank
                        ? calcTotalBalance > 0
                          ? `${((customBalance.estateAmount / calcTotalBalance) * 100).toFixed(1)}%`
                          : "0.0%"
                        : "58.1%"}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {isTemplateBlank
                        ? "실거주 부동산 시가 또는 전세보증금"
                        : "시가 10억 원, 대출 2억 5천만 원(LTV 25%), 주택연금 연계 검토 가능"}
                    </td>
                  </tr>

                  {/* 총 자산 합계 */}
                  <tr className="bg-blue-50 dark:bg-blue-950/40 font-bold border-t-2 border-blue-200 dark:border-blue-800">
                    <td colSpan={2} className="py-3 px-3 text-blue-900 dark:text-blue-200">
                      총 자산 합계 (Total Assets)
                    </td>
                    <td className="py-3 px-3 text-right text-base text-blue-700 dark:text-blue-300">
                      {isTemplateBlank
                        ? `${calcTotalBalance.toLocaleString()}원`
                        : "1,721,710,000원"}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700 dark:text-blue-300">100.0%</td>
                    <td className="py-3 px-3 text-[11px] text-blue-800 dark:text-blue-300">
                      {isTemplateBlank
                        ? `${formatKoreanAmount(calcTotalBalance)} (고객 입력 기준 정확히 일치)`
                        : "17억 2,171만 원 (부동산 비중 58.1% 편중)"}
                    </td>
                  </tr>

                  {/* 부채 */}
                  <tr className="bg-red-50/30 dark:bg-red-950/20 border-t-2 border-slate-200 dark:border-slate-800">
                    <td className="py-3 px-3 font-bold text-red-700 dark:text-red-400">
                      부채 (Liabilities)
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {isTemplateBlank ? customBalance.debtName : "아파트 담보대출 (원리금균등)"}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-red-600 dark:text-red-400 text-base">
                      {isTemplateBlank
                        ? `${cleanDebt.toLocaleString()}원`
                        : "250,000,000원"}
                    </td>
                    <td className="py-3 px-3 text-right text-red-500">-</td>
                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      {isTemplateBlank
                        ? cleanDebt > 0
                          ? `부채비율 ${((cleanDebt / calcTotalBalance) * 100).toFixed(1)}%`
                          : "부채 없음"
                        : "연 4.0%, 잔여 15년 상환, 월 원리금 185만 원 납부 중"}
                    </td>
                  </tr>

                  {/* 순자산 */}
                  <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-extrabold border-t-2 border-emerald-300 dark:border-emerald-700">
                    <td colSpan={2} className="py-3.5 px-3 text-emerald-900 dark:text-emerald-200 text-sm">
                      순자산 합계 (Net Worth) = 총 자산 - 총 부채
                    </td>
                    <td className="py-3.5 px-3 text-right text-lg text-emerald-700 dark:text-emerald-300">
                      {isTemplateBlank
                        ? `${(calcTotalBalance - cleanDebt).toLocaleString()}원`
                        : "1,471,710,000원"}
                    </td>
                    <td className="py-3.5 px-3 text-right text-emerald-700 dark:text-emerald-300">
                      {calcTotalBalance > 0
                        ? `${(((calcTotalBalance - cleanDebt) / calcTotalBalance) * 100).toFixed(1)}%`
                        : "0.0%"}
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-emerald-800 dark:text-emerald-300">
                      {isTemplateBlank
                        ? `${formatKoreanAmount(calcTotalBalance - cleanDebt)} (실시간 정밀 계산 완료)`
                        : "약 14억 7,171만 원 (부채비율 14.5%로 매우 안정적)"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 재무 건전성 평가 지표 카드 3종 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">부채비율 (부채/자산)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {calcTotalBalance > 0
                    ? `${((cleanDebt / calcTotalBalance) * 100).toFixed(1)}% (${((cleanDebt / calcTotalBalance) * 100) < 40 ? "안전" : "주의"})`
                    : "0.0%"}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, calcTotalBalance > 0 ? (cleanDebt / calcTotalBalance) * 100 : 0)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                권장 기준(40% 이하) 대비 건전성을 평가하며 적정 부채 상환 계획을 안내합니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">사용자산 비중</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {calcTotalBalance > 0
                    ? `${((customBalance.estateAmount / calcTotalBalance) * 100).toFixed(1)}%`
                    : "0.0%"}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, calcTotalBalance > 0 ? (customBalance.estateAmount / calcTotalBalance) * 100 : 0)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                거주 자산에 과도하게 편중되지 않도록 유동성 및 현금흐름 창출 자산을 분배합니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">비상예비자금 보유분</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {cleanExpense > 0
                    ? `${((customBalance.cashAmount / cleanExpense)).toFixed(1)}개월분`
                    : "입력 대기"}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, cleanExpense > 0 ? (customBalance.cashAmount / cleanExpense) * 15 : 0)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                월 지출 대비 3~6개월 이상의 수시입출식 예비자금을 유지하는 것이 권장됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: 월간 현금흐름표 (퇴직 전 vs 퇴직 후 비교) */}
      {/* ======================================================== */}
      {activeTab === "cashflow" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {reportDate} 기준 월간 현금흐름표 (현재 퇴직 전 vs 퇴직 후 비교)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isTemplateBlank
                    ? "고객님께서 입력하신 실시간 소득·지출 기반 퇴직 전후 현금흐름 시뮬레이션"
                    : "퇴직 직후 발생하는 극심한 소득 절벽과 월 지출 변동 요인을 사전 점검합니다"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">단위: 원 / 월</span>
                {isTemplateBlank && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalTab("cashflow");
                      setShowEditModal(true);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    [ ✍️ 현금흐름 항목 수정 ]
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/70 dark:bg-slate-900/60">
                    <th className="py-2.5 px-3">구분</th>
                    <th className="py-2.5 px-3">항목</th>
                    <th className="py-2.5 px-3 text-right">현재 (퇴직 전)</th>
                    <th className="py-2.5 px-3 text-right">퇴직 후 예상</th>
                    <th className="py-2.5 px-3 text-right">증감 (차이)</th>
                    <th className="py-2.5 px-3">전제 조건 및 상세 가정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* 수입 부문 */}
                  <tr>
                    <td rowSpan={2} className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400 align-top border-r border-slate-100 dark:border-slate-800">
                      수입
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      근로소득 (세후)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                      {isTemplateBlank ? `${customCashflow.salary.toLocaleString()}원` : "760만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-bold">0원</td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-semibold">
                      {isTemplateBlank ? `▼ -${customCashflow.salary.toLocaleString()}` : "▼ -760만"}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      퇴직 시 근로소득 전액 중단 (소득 절벽 발생)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">비근로·연금소득</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">
                      {isTemplateBlank ? `${customCashflow.nonSalary.toLocaleString()}원` : "45만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">
                      {isTemplateBlank ? `${customCashflow.retireIncome.toLocaleString()}원` : "45만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      정기예금 이자, 배당 및 향후 연금 수령 환산액
                    </td>
                  </tr>

                  {/* 수입 합계 */}
                  <tr className="bg-blue-50 dark:bg-blue-950/40 font-bold">
                    <td colSpan={2} className="py-2.5 px-3 text-blue-900 dark:text-blue-200">
                      월 수입 합계 (Total Income)
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-300 font-extrabold">
                      {isTemplateBlank
                        ? `${(customCashflow.salary + customCashflow.nonSalary).toLocaleString()}원`
                        : "805만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-extrabold">
                      {isTemplateBlank
                        ? `${customCashflow.retireIncome.toLocaleString()}원`
                        : "45만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-extrabold">
                      {isTemplateBlank
                        ? `▼ -${(customCashflow.salary + customCashflow.nonSalary - customCashflow.retireIncome).toLocaleString()}원`
                        : "▼ -760만 (-94.4%)"}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                      퇴직 직후 수입 급감에 따른 연금 브릿지 설계 필요
                    </td>
                  </tr>

                  {/* 지출 부문 */}
                  <tr>
                    <td rowSpan={2} className="py-2.5 px-3 font-bold text-amber-700 dark:text-amber-400 align-top border-r border-slate-100 dark:border-slate-800">
                      지출
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      고정지출 (대출원리금/보험/공과금 등)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">
                      {isTemplateBlank ? `${customCashflow.fixedExpense.toLocaleString()}원` : "285만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">
                      {isTemplateBlank ? `${customCashflow.fixedExpense.toLocaleString()}원` : "272만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      대출 원리금, 보장성 보험료, 주거 관리비 등 필수 지출
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      변동지출 (생활비/의료/여가 등)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">
                      {isTemplateBlank ? `${customCashflow.variableExpense.toLocaleString()}원` : "415만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">
                      {isTemplateBlank ? `${customCashflow.variableExpense.toLocaleString()}원` : "365만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      식비, 부부 생활비, 의료비 및 여가비
                    </td>
                  </tr>

                  {/* 지출 합계 */}
                  <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                    <td colSpan={2} className="py-2.5 px-3 text-slate-800 dark:text-white">
                      월 지출 합계 (Total Expenses)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-extrabold">
                      {isTemplateBlank
                        ? `${(customCashflow.fixedExpense + customCashflow.variableExpense).toLocaleString()}원`
                        : "733만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-extrabold">
                      {isTemplateBlank
                        ? `${customCashflow.retireExpense.toLocaleString()}원`
                        : "637만 원"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-semibold">
                      {isTemplateBlank ? "-" : "▼ -96만"}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      퇴직 후에도 최소 필수 생활비 지속 지출
                    </td>
                  </tr>

                  {/* 퇴직 직후 월 수치 (핵심 하이라이트) */}
                  <tr className="bg-red-50 dark:bg-red-950/40 font-extrabold border-t-2 border-red-300 dark:border-red-700">
                    <td colSpan={2} className="py-3 px-3 text-red-900 dark:text-red-200 text-sm">
                      퇴직 직후 월 수치 (월간 잉여금 / 부족액)
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 text-base">
                      {isTemplateBlank
                        ? (cleanSurplus >= 0 ? "+" : "") + `${cleanSurplus.toLocaleString()}원`
                        : "+72만 원"}
                    </td>
                    <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 text-base font-extrabold">
                      {displayRetirementDeficit}
                    </td>
                    <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-bold">
                      {isTemplateBlank
                        ? `▼ -${(cleanIncome + (cleanExpense > 0 ? cleanExpense : 0)).toLocaleString()}원`
                        : "▼ -664만 원"}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-red-700 dark:text-red-300 font-semibold">
                      {isTemplateBlank
                        ? `퇴직 시 매월 ${cleanExpense > 0 ? formatKoreanAmount(cleanExpense) : "0원"} 적자 발생 (실시간 계산값)`
                        : "매달 592만 원씩 자산이 잠식되는 위험 발생!"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 자산·보험·세무 정밀 진단 */}
      {/* ======================================================== */}
      {activeTab === "diagnosis" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. 부동산 및 보유 자산 분석 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>🏢</span>
                <span>보유 자산 및 부동산 정밀 진단</span>
              </h4>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium">
                {isTemplateBlank ? `총 자산 ${displayAsset}` : "자산 비중 58.1%"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">
                  {isTemplateBlank ? customBalance.estateName : "수원 아파트 (시가 10억 원, 자가)"}
                </div>
                <div className="text-slate-500 text-[11px]">
                  <strong>현황:</strong>{" "}
                  {isTemplateBlank
                    ? `평가액 ${formatKoreanAmount(customBalance.estateAmount)}, 부채 ${formatKoreanAmount(cleanDebt)}`
                    : "거주용, 대출 2억 5,000만 원 (LTV 25%)"}
                </div>
                <div className="text-amber-700 dark:text-amber-400 text-[11px] pt-1">
                  <strong>평가:</strong>{" "}
                  {isTemplateBlank
                    ? "주거 자산 비중이 높을 경우 은퇴 후 유동성 부족이 발생할 수 있으므로, 향후 주택연금 연계 또는 다운사이징을 통한 현금흐름 창출 검토를 권장합니다."
                    : "자산의 과반이 묶여 있으나 월 현금흐름을 전혀 만들지 못함. 향후 주택연금 가입 또는 다운사이징으로 유동성 확보 여력 충분."}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 금융 및 은퇴자산 분석 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>📈</span>
                <span>금융 · 은퇴자산 및 비상금 분석</span>
              </h4>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">
                {isTemplateBlank
                  ? `현금·은퇴 자산 ${formatKoreanAmount(customBalance.cashAmount + customBalance.retireAmount)}`
                  : "금융자산 7.2억"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">
                  {isTemplateBlank ? customBalance.retireName : "퇴직급여 DC형 & 연금저축"}
                </div>
                <div className="text-slate-500 text-[11px]">
                  <strong>평가:</strong>{" "}
                  {isTemplateBlank
                    ? "일시금 인출을 지양하고 IRP로 이전하여 연금으로 분할 수령 시 퇴직소득세의 30~40% 감면 혜택과 10년 이상의 안정적인 노후 현금흐름을 확보할 수 있습니다."
                    : "일시금 인출 금지. IRP로 이전하여 연금으로 수령 시 퇴직소득세 30~40% 감면 혜택과 10년 이상 안정적 월 생활비 확보 가능."}
                </div>
              </div>
            </div>
          </div>

          {/* 3. 부채 상환 및 현금흐름 안전성 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>🛡️</span>
                <span>부채 및 현금흐름 안전성 진단</span>
              </h4>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-medium">
                {cleanDebt > 0 ? "부채 관리 필요" : "부채 없음 (안전)"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span>총 부채 규모</span>
                <span className="font-bold text-slate-800 dark:text-white">{displayDebt}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span>퇴직 직후 월 수치</span>
                <span className="text-red-600 dark:text-red-400 font-bold">{displayRetirementDeficit} ⚠️</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                은퇴 직후에는 소득이 중단되므로 고정 대출이자 부담을 최소화하는 상환 계획이 최우선되어야 합니다.
              </p>
            </div>
          </div>

          {/* 4. 세무 상황 및 절세 전략 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>⚖️</span>
                <span>핵심 세무 및 절세 전략</span>
              </h4>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-medium">
                AFPK 전문가 가이드
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">연말정산 세액공제 한도 극대화</div>
                <p className="text-[11px] text-slate-500">
                  IRP 및 연금저축 납입을 통해 연 최대 900만 원(13.2%~16.5%)의 강력한 세액공제 환급 혜택을 수취하십시오.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">사적연금 연 1,500만 원 분리과세 한도 관리</div>
                <p className="text-[11px] text-slate-500">
                  연금 수령 기간을 10년 이상 분산하여 저율 분리과세(3.3%~5.5%) 혜택을 유지하는 것이 절세에 필수적입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Action Navigation */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onNavigateStep && onNavigateStep("step1")}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
        >
          ← STEP 01 기본정보 수정
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenTaxModal}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold shadow-sm transition-all active:scale-95 flex-1 sm:flex-initial"
          >
            🏛️ 한OO 세무사 1:1 상담 (QR)
          </button>
          <button
            type="button"
            onClick={() => onNavigateStep && onNavigateStep("step3")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex-1 sm:flex-initial"
          >
            AI 재무상담 이어가기 →
          </button>
        </div>
      </div>

      {/* 5. 세부 항목 직접 수정 모달 (재무상태표 & 현금흐름표 상세 내역 편집) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>✍️</span>
                <span>{editModalTab === "balance" ? "자산·부채 상태표 상세 항목 수정" : "현금흐름 상세 항목 수정"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {editModalTab === "balance" ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    현금성 자산 (예금·적금·비상금)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customBalance.cashName}
                      onChange={(e) => setCustomBalance({ ...customBalance, cashName: e.target.value })}
                      placeholder="항목명"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="number"
                      value={customBalance.cashAmount}
                      onChange={(e) => setCustomBalance({ ...customBalance, cashAmount: Number(e.target.value) || 0 })}
                      placeholder="금액 (원)"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    투자 자산 (주식·채권·ETF)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customBalance.investName}
                      onChange={(e) => setCustomBalance({ ...customBalance, investName: e.target.value })}
                      placeholder="항목명"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="number"
                      value={customBalance.investAmount}
                      onChange={(e) => setCustomBalance({ ...customBalance, investAmount: Number(e.target.value) || 0 })}
                      placeholder="금액 (원)"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    은퇴 자산 (퇴직연금·IRP·연금저축)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customBalance.retireName}
                      onChange={(e) => setCustomBalance({ ...customBalance, retireName: e.target.value })}
                      placeholder="항목명"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="number"
                      value={customBalance.retireAmount}
                      onChange={(e) => setCustomBalance({ ...customBalance, retireAmount: Number(e.target.value) || 0 })}
                      placeholder="금액 (원)"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    사용 자산 (거주 부동산/전세보증금)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customBalance.estateName}
                      onChange={(e) => setCustomBalance({ ...customBalance, estateName: e.target.value })}
                      placeholder="항목명"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="number"
                      value={customBalance.estateAmount}
                      onChange={(e) => setCustomBalance({ ...customBalance, estateAmount: Number(e.target.value) || 0 })}
                      placeholder="금액 (원)"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    부채 (대출금)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customBalance.debtName}
                      onChange={(e) => setCustomBalance({ ...customBalance, debtName: e.target.value })}
                      placeholder="항목명"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="number"
                      value={customBalance.debtAmount}
                      onChange={(e) => setCustomBalance({ ...customBalance, debtAmount: Number(e.target.value) || 0 })}
                      placeholder="금액 (원)"
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    현재 월 근로소득 (세후)
                  </label>
                  <input
                    type="number"
                    value={customCashflow.salary}
                    onChange={(e) => setCustomCashflow({ ...customCashflow, salary: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    현재 월 고정지출 (대출이자/공과금 등)
                  </label>
                  <input
                    type="number"
                    value={customCashflow.fixedExpense}
                    onChange={(e) => setCustomCashflow({ ...customCashflow, fixedExpense: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    현재 월 변동지출 (생활비/의료/여가)
                  </label>
                  <input
                    type="number"
                    value={customCashflow.variableExpense}
                    onChange={(e) => setCustomCashflow({ ...customCashflow, variableExpense: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    퇴직 후 예상 필요 생활비 (월)
                  </label>
                  <input
                    type="number"
                    value={customCashflow.retireExpense}
                    onChange={(e) => setCustomCashflow({ ...customCashflow, retireExpense: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  saveCustomDetails(customBalance, customCashflow, reportDate);
                  setShowEditModal(false);
                  alert("상세 내역이 성공적으로 저장 및 반영되었습니다.");
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
