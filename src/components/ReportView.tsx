"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { evaluateFinancialGoals, EvaluatedGoalItem, SolutionComparisonItem } from "@/lib/goalEvaluation";

interface ReportViewProps {
  onNavigateStep?: (step: "step1" | "step2" | "step3" | "financial_status" | "goals" | "report") => void;
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
  aiGoals?: EvaluatedGoalItem[];
  aiSolutions?: SolutionComparisonItem[];
  isAiEvaluating?: boolean;
  onTriggerAiEvaluation?: () => void;
  evaluatedModelName?: string;
}

export interface GoalItem {
  rank: string;
  name: string;
  period: string;
  needed: string;
  prep: string;
  shortage: string;
  status: "달성 가능 🟢" | "사전 합의 🟡" | "위험 경보 🔴" | "진단 대기 ⚪";
}

export interface ReportData {
  institution: string;
  customClientName: string;
  issueDate: string;
  
  // 1. Balance Sheet
  cashName: string;
  cashAmount: number;
  cashMemo: string;

  investName: string;
  investAmount: number;
  investMemo: string;

  pensionName: string;
  pensionAmount: number;
  pensionMemo: string;

  realEstateName: string;
  realEstateAmount: number;
  realEstateMemo: string;

  debtName: string;
  debtAmount: number;
  debtMemo: string;

  // 2. Cash Flow
  currentIncome: number;
  currentIncomeMemo: string;
  postRetireIncome: number;
  postRetireIncomeMemo: string;

  currentExpense: number;
  currentExpenseMemo: string;
  postRetireExpense: number;
  postRetireExpenseMemo: string;

  // 3. Goals
  goals: GoalItem[];

  // 4. Opinions
  opinions: string[];
  adviserTitle: string;
}

// 50대 은퇴설계 가상 고객 모범 데이터셋
const DEFAULT_REPORT_DATA: ReportData = {
  institution: "AFPK 재무주치의",
  customClientName: "",
  issueDate: "",
  
  cashName: "정기예금 · 적금",
  cashAmount: 200000000,
  cashMemo: "비상금 및 자녀 결혼자금 예비",

  investName: "삼성전자, 미국S&P500, 나스닥100 ETF",
  investAmount: 41705500,
  investMemo: "삼성전자 53% 집중 ➡️ ISA 이전 권고",

  pensionName: "퇴직급여(4억) + 연금저축(8천만)",
  pensionAmount: 480000000,
  pensionMemo: "퇴직급여 1년 뒤 수령 ➡️ IRP 이전 필수",

  realEstateName: "수원 아파트 (자가)",
  realEstateAmount: 1000000000,
  realEstateMemo: "거주용, 71세 주택연금 연계 권고",

  debtName: "총 부채 (아파트 담보대출)",
  debtAmount: 250000000,
  debtMemo: "연 4%, 잔여 15년 원리금균등 (월 185만)",

  currentIncome: 8050000,
  currentIncomeMemo: "급여 760만, 이자 40만, 배당 5만",
  postRetireIncome: 450000,
  postRetireIncomeMemo: "근로소득 중단으로 수입이 94% 급감",

  currentExpense: 7330000,
  currentExpenseMemo: "생활비 415만 + 고정지출 285만 + 저축 33만",
  postRetireExpense: 6370000,
  postRetireExpenseMemo: "자녀 학비 종료되나 대출(185만)+건보료(40만) 지속",

  goals: [
    {
      rank: "🥇 1",
      name: "대출 상환 (퇴직급여 활용)",
      period: "1년 내",
      needed: "2억 5,000만 원",
      prep: "현금 1억 + 퇴직금 1.5억",
      shortage: "0원",
      status: "달성 가능 🟢",
    },
    {
      rank: "🥈 2",
      name: "장남 결혼자금 마련",
      period: "2년 내",
      needed: "7,000만 원",
      prep: "보유 정기예금 2억 중",
      shortage: "0원",
      status: "달성 가능 🟢",
    },
    {
      rank: "🥉 3",
      name: "은퇴자금 확보 (월 300만 × 20년)",
      period: "61세 ~ 80세",
      needed: "약 6억 8,800만 원",
      prep: "약 3억 7,000만 원",
      shortage: "약 3억 2,000만 원",
      status: "위험 경보 🔴",
    },
    {
      rank: "🏅 4",
      name: "상가주택 상속 대비",
      period: "4년 내",
      needed: "상속세 약 7,760만 원",
      prep: "연부연납 + 임대수입",
      shortage: "합의 필요",
      status: "사전 합의 🟡",
    },
  ],

  opinions: [
    "대출 2.5억 원은 현금 1억 원과 퇴직급여 1.5억 원으로 즉시 상환하여 월 원리금 185만 원 부담을 없애야 합니다.",
    "퇴직급여 2.5억 원 IRP 이전: 일시금 인출을 지양하고, IRP로 이전하여 연금으로 수령 시 퇴직소득세 30%를 절감하고 소득 공백기(61~64세) 생활비를 확보하십시오.",
    "71세 주택연금 연계: 금융자산이 소진되는 70대 이후에는 수원 아파트(10억)를 주택연금(월 297만 원)으로 전환하여 부부 100세 종신까지 월 300만 원 생활비를 완벽히 보장할 수 있습니다.",
  ],
  adviserTitle: "공인 자문위원: AFPK 재무주치의",
};

// 모든 항목 공란 데이터셋
const BLANK_REPORT_DATA: ReportData = {
  institution: "AFPK 재무주치의",
  customClientName: "",
  issueDate: "",

  cashName: "현금 및 요구불 예금",
  cashAmount: 0,
  cashMemo: "자유 입출금 및 비상자금",

  investName: "주식 / 채권 / 펀드",
  investAmount: 0,
  investMemo: "투자 자산 내역",

  pensionName: "연금저축 / IRP / 퇴직연금",
  pensionAmount: 0,
  pensionMemo: "은퇴 준비 자산",

  realEstateName: "거주 주택 / 부동산",
  realEstateAmount: 0,
  realEstateMemo: "사용 자산 내역",

  debtName: "담보대출 / 신용대출",
  debtAmount: 0,
  debtMemo: "상환 예정 부채 내역",

  currentIncome: 0,
  currentIncomeMemo: "근로소득 및 기타소득",
  postRetireIncome: 0,
  postRetireIncomeMemo: "퇴직 후 예상 수입",

  currentExpense: 0,
  currentExpenseMemo: "월간 고정+변동지출",
  postRetireExpense: 0,
  postRetireExpenseMemo: "퇴직 후 예상 지출",

  goals: [
    {
      rank: "-",
      name: "부채 상환 / 비상금 확보",
      period: "1년 내",
      needed: "0원",
      prep: "0원",
      shortage: "0원",
      status: "달성 가능 🟢",
    },
    {
      rank: "-",
      name: "자녀 교육 / 결혼자금 지원",
      period: "2년 ~ 3년 내",
      needed: "0원",
      prep: "0원",
      shortage: "0원",
      status: "달성 가능 🟢",
    },
    {
      rank: "-",
      name: "은퇴 생활비 마련",
      period: "은퇴 시점",
      needed: "0원",
      prep: "0원",
      shortage: "0원",
      status: "위험 경보 🔴",
    },
    {
      rank: "-",
      name: "상속 및 증여 플랜",
      period: "5년 내",
      needed: "0원",
      prep: "0원",
      shortage: "0원",
      status: "사전 합의 🟡",
    },
  ],

  opinions: [
    "고객의 실질 자산 및 현금흐름 분석을 바탕으로 맞춤형 우선순위 해결책을 제안합니다.",
    "퇴직 전후 소득 공백기(Bridge Period) 대비를 위한 IRP 및 개인연금 수령 설계를 우선 권고합니다.",
    "고령기 안정적 현금흐름 확보를 위해 거주 주택을 활용한 주택연금 연계를 적극 검토하십시오.",
  ],
  adviserTitle: "공인 자문위원: AFPK 재무주치의",
};

export default function ReportView({
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
  aiGoals,
  aiSolutions,
  isAiEvaluating = false,
  onTriggerAiEvaluation,
  evaluatedModelName = "gemini-flash-latest",
}: ReportViewProps) {
  const { user, profile } = useAuth();

  // 실제 서비스 이용 날짜 (발행일자)
  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 리포트 상태 관리
  const [reportData, setReportData] = useState<ReportData>(() => {
    return isTemplateBlank ? BLANK_REPORT_DATA : DEFAULT_REPORT_DATA;
  });

  // 모달 제어 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"client" | "balance" | "cashflow" | "goals" | "opinions">("client");

  // 모달 폼 로컬 편집용 임시 상태
  const [tempData, setTempData] = useState<ReportData>(reportData);

  // 상위의 isTemplateBlank 변경 시 동기화
  useEffect(() => {
    if (isTemplateBlank) {
      const evalResult = evaluateFinancialGoals({
        isTemplateBlank: true,
        totalAsset,
        totalDebt,
        monthlyIncome,
        monthlyExpense,
        emergencyFund,
        goalName,
        goalAmount,
        goalDate,
        aiGoals,
        aiSolutions,
      });

      const convertedGoals: GoalItem[] = (evalResult.goals || []).map((g, idx) => ({
        rank: (typeof g?.rank === "string" && g.rank.trim() ? g.rank.split(":")[0].trim() : `${idx + 1}순위`) || "-",
        name: g?.name || `재무목표 ${idx + 1}`,
        period: g?.period || "-",
        needed: g?.needed || "0원",
        prep: g?.prep || "0원",
        shortage: g?.shortage || "0원",
        status: (g?.status as any) || "진단 대기 ⚪",
      }));

      setReportData((prev) => ({
        ...BLANK_REPORT_DATA,
        customClientName: prev.customClientName,
        goals: convertedGoals,
      }));
    } else {
      setReportData(DEFAULT_REPORT_DATA);
    }
  }, [isTemplateBlank]);

  // 상위에서 전달된 입력값 및 AI 실시간 정밀 진단(Gemini Pro) 결과 바인딩
  useEffect(() => {
    const evalResult = evaluateFinancialGoals({
      isTemplateBlank,
      totalAsset,
      totalDebt,
      monthlyIncome,
      monthlyExpense,
      emergencyFund,
      goalName,
      goalAmount,
      goalDate,
      aiGoals,
      aiSolutions,
    });

    const convertedGoals: GoalItem[] = (evalResult.goals || []).map((g, idx) => ({
      rank: (typeof g?.rank === "string" && g.rank.trim() ? g.rank.split(":")[0].trim() : `${idx + 1}순위`) || "-",
      name: g?.name || `재무목표 ${idx + 1}`,
      period: g?.period || "-",
      needed: g?.needed || "0원",
      prep: g?.prep || "0원",
      shortage: g?.shortage || "0원",
      status: (g?.status as any) || "진단 대기 ⚪",
    }));

    if (isTemplateBlank) {
      const parsedAsset = parseInt(totalAsset.replace(/[^0-9]/g, ""), 10) || 0;
      const parsedDebt = parseInt(totalDebt.replace(/[^0-9]/g, ""), 10) || 0;
      const parsedInc = parseInt(monthlyIncome.replace(/[^0-9]/g, ""), 10) || 0;
      const parsedExp = parseInt(monthlyExpense.replace(/[^0-9]/g, ""), 10) || 0;

      setReportData((prev) => ({
        ...prev,
        cashAmount: prev.cashAmount || Math.round(parsedAsset * 0.15),
        investAmount: prev.investAmount || Math.round(parsedAsset * 0.15),
        pensionAmount: prev.pensionAmount || Math.round(parsedAsset * 0.2),
        realEstateAmount: prev.realEstateAmount || Math.round(parsedAsset * 0.5),
        debtAmount: parsedDebt || prev.debtAmount,
        currentIncome: parsedInc || prev.currentIncome,
        currentExpense: parsedExp || prev.currentExpense,
        goals: convertedGoals,
      }));
    } else {
      // 가상 고객 모드라도 AI 재진단 결과나 입력값에 맞추어 goals 동적 동기화
      setReportData((prev) => ({
        ...prev,
        goals: convertedGoals,
      }));
    }
  }, [isTemplateBlank, totalAsset, totalDebt, monthlyIncome, monthlyExpense, emergencyFund, goalName, goalAmount, goalDate, aiGoals, aiSolutions]);

  // 로컬 스토리지에 저장된 리포트 데이터 복원 (초기 1회)
  useEffect(() => {
    try {
      const savedReport = localStorage.getItem("afpk_custom_report_data_v2");
      if (savedReport) {
        const parsed = JSON.parse(savedReport);
        if (parsed) {
          setReportData(parsed);
          setTempData(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load report from localStorage", e);
    }
  }, []);

  // 고객명 계산:
  // - 가상 데이터 모드(!isTemplateBlank): "김한국"
  // - 그 외(직접 입력 모드): 구글 로그인 연동된 본인 이름 (사용자 요청 엄수)
  const loggedInUserName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "고객";

  const displayClientName = isTemplateBlank
    ? ((reportData.customClientName || "").trim() || loggedInUserName)
    : "김한국";

  // 계산 필드들
  const totalAssetsSum =
    reportData.cashAmount +
    reportData.investAmount +
    reportData.pensionAmount +
    reportData.realEstateAmount;
  const netWorth = totalAssetsSum - reportData.debtAmount;
  const debtRatio =
    totalAssetsSum > 0 ? ((reportData.debtAmount / totalAssetsSum) * 100).toFixed(1) : "0.0";
  const netWorthRatio =
    totalAssetsSum > 0 ? ((netWorth / totalAssetsSum) * 100).toFixed(1) : "0.0";

  const cashRatio =
    totalAssetsSum > 0 ? ((reportData.cashAmount / totalAssetsSum) * 100).toFixed(1) : "0.0";
  const investRatio =
    totalAssetsSum > 0 ? ((reportData.investAmount / totalAssetsSum) * 100).toFixed(1) : "0.0";
  const pensionRatio =
    totalAssetsSum > 0 ? ((reportData.pensionAmount / totalAssetsSum) * 100).toFixed(1) : "0.0";
  const realEstateRatio =
    totalAssetsSum > 0 ? ((reportData.realEstateAmount / totalAssetsSum) * 100).toFixed(1) : "0.0";

  // 현금흐름 계산
  const currentSurplus = reportData.currentIncome - reportData.currentExpense;
  const postRetireSurplus = reportData.postRetireIncome - reportData.postRetireExpense;
  const incomeDiff = reportData.postRetireIncome - reportData.currentIncome;
  const expenseDiff = reportData.postRetireExpense - reportData.currentExpense;
  const surplusDiff = postRetireSurplus - currentSurplus;

  // 모달 열기 핸들러
  const handleOpenModal = () => {
    setTempData(JSON.parse(JSON.stringify(reportData)));
    setIsEditModalOpen(true);
  };

  // 모달 저장 핸들러
  const handleSaveModal = () => {
    setReportData(tempData);
    try {
      localStorage.setItem("afpk_custom_report_data_v2", JSON.stringify(tempData));
    } catch (e) {
      console.error("Failed to save report to localStorage", e);
    }
    setIsEditModalOpen(false);
  };

  // 모달 내부 벤치마크 복원
  const handleResetModalToBenchmark = () => {
    setTempData(JSON.parse(JSON.stringify(DEFAULT_REPORT_DATA)));
  };

  // 모달 내부 공란 초기화
  const handleResetModalToBlank = () => {
    setTempData(JSON.parse(JSON.stringify(BLANK_REPORT_DATA)));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B2568] via-[#103180] to-[#1E3A8A] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              공인 은퇴설계 종합 진단 리포트
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-semibold">
              ✦ Supabase 실데이터 공식 보고서
            </span>
          </div>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl">
            재무상태표, 현금흐름표, 4대 재무목표 및 솔루션을 집약한 종합 자문 리포트입니다. 고객의 상황에 맞게 상단의 [리포트 세부 항목 작성/수정]을 통해 즉시 수정 및 반영할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 flex-shrink-0 flex-wrap">
          {onTriggerAiEvaluation && (
            <button
              type="button"
              onClick={onTriggerAiEvaluation}
              disabled={isAiEvaluating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-75 cursor-pointer"
            >
              {isAiEvaluating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{evaluatedModelName} 진단 중...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>{evaluatedModelName} AI 목표 재진단</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0B2568] text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer border border-white/80"
          >
            <span>✍️</span>
            <span>리포트 세부 항목 작성/수정</span>
          </button>
          <button
            type="button"
            onClick={onOpenTaxModal}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>🏛️</span>
            <span>세무사 검토 요청</span>
          </button>
        </div>
      </div>

      {/* Guidance Banner */}
      {isTemplateBlank && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-xl">📝</span>
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">
                신규 고객 공인 리포트 작성 모드:{" "}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                모든 항목이 빈 양식 상태입니다. 상단의 <strong>[ ✍️ 리포트 세부 항목 작성/수정 ]</strong> 버튼을 눌러 고객 정보를 작성하면 본 리포트에 즉시 반영됩니다.
              </span>
            </div>
          </div>
          {onLoadSupabaseData && (
            <button
              type="button"
              onClick={onLoadSupabaseData}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex-shrink-0 transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              🔄 Supabase 데이터 불러오기
            </button>
          )}
        </div>
      )}

      {/* 2. Official Report Document Container (Paper style) */}
      <div className="bg-white dark:bg-[#11192E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 sm:p-10 space-y-8 max-w-4xl mx-auto">
        {/* Document Header Metadata */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
              Financial Planning Comprehensive Report
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              은퇴 전후 재무설계 종합 진단서
            </h1>
          </div>
          <div className="text-right text-xs space-y-1">
            <div className="flex items-center justify-end gap-2">
              <span className="text-slate-400">발행일자:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {reportData.issueDate || todayStr}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-slate-400">자문기관:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{reportData.institution}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-slate-400">고객명:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {displayClientName} {displayClientName === "익명" || displayClientName === "고객명 미입력" ? "" : "님"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: 재무상태표 (Balance Sheet) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-sm"></span>
              <span>1. 재무상태표 요약 (자산 및 부채 현황)</span>
            </h3>
            <span className="text-xs text-slate-400">Supabase 10월 재무상태표 상세</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">분류</th>
                  <th className="py-2.5 px-3">세부 항목</th>
                  <th className="py-2.5 px-3 text-right">평가액</th>
                  <th className="py-2.5 px-3 text-right">비중</th>
                  <th className="py-2.5 px-3">진단 메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">현금성자산</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{reportData.cashName}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                    {reportData.cashAmount.toLocaleString("ko-KR")}원
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{cashRatio}%</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">{reportData.cashMemo}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">투자자산</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{reportData.investName}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                    {reportData.investAmount.toLocaleString("ko-KR")}원
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{investRatio}%</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">{reportData.investMemo}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">은퇴자산</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{reportData.pensionName}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                    {reportData.pensionAmount.toLocaleString("ko-KR")}원
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{pensionRatio}%</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">{reportData.pensionMemo}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">사용자산</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{reportData.realEstateName}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                    {reportData.realEstateAmount.toLocaleString("ko-KR")}원
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{realEstateRatio}%</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">{reportData.realEstateMemo}</td>
                </tr>
                <tr className="bg-blue-50/60 dark:bg-blue-950/40 font-bold">
                  <td colSpan={2} className="py-2.5 px-3 text-blue-900 dark:text-blue-200">총 자산 합계</td>
                  <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-300 font-extrabold">
                    {totalAssetsSum.toLocaleString("ko-KR")}원
                  </td>
                  <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-300">100.0%</td>
                  <td className="py-2.5 px-3 text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                    {totalAssetsSum > 0 ? "자산 총계 분석 완료" : "입력 대기"}
                  </td>
                </tr>
                <tr className="bg-red-50/40 dark:bg-red-950/20 font-semibold">
                  <td colSpan={2} className="py-2.5 px-3 text-red-700 dark:text-red-400">{reportData.debtName}</td>
                  <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-bold">
                    {reportData.debtAmount.toLocaleString("ko-KR")}원
                  </td>
                  <td className="py-2.5 px-3 text-right text-red-500">부채비율 {debtRatio}%</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">{reportData.debtMemo}</td>
                </tr>
                <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-extrabold text-sm">
                  <td colSpan={2} className="py-3 px-3 text-emerald-900 dark:text-emerald-200">순자산 (Net Worth)</td>
                  <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-300">
                    {netWorth.toLocaleString("ko-KR")}원
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-300">{netWorthRatio}%</td>
                  <td className="py-3 px-3 text-[11px] text-emerald-800 dark:text-emerald-300">
                    {netWorth >= 0 ? "안정적 순자산 보유" : "부채 초과 상태"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: 현금흐름표 (Cash Flow Statement) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-sm"></span>
              <span>2. 월간 현금흐름표 (퇴직 전 vs 퇴직 후 비교)</span>
            </h3>
            <span className="text-xs text-slate-400">Supabase 10월 현금흐름표 상세</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">구분</th>
                  <th className="py-2.5 px-3 text-right">현재 (퇴직 전)</th>
                  <th className="py-2.5 px-3 text-right">퇴직 후 1~3년 (현상태 유지)</th>
                  <th className="py-2.5 px-3 text-right">증감 (차이)</th>
                  <th className="py-2.5 px-3">분석 결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-blue-700 dark:text-blue-400">월 수입 합계</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                    {Math.round(reportData.currentIncome / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-red-500">
                    {Math.round(reportData.postRetireIncome / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${incomeDiff < 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {(incomeDiff < 0 ? "▼ " : "▲ +") + Math.round(incomeDiff / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-red-600 dark:text-red-400">
                    {reportData.postRetireIncomeMemo}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-amber-700 dark:text-amber-400">월 지출 합계</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                    {Math.round(reportData.currentExpense / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                    {Math.round(reportData.postRetireExpense / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${expenseDiff <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {(expenseDiff <= 0 ? "▼ " : "▲ +") + Math.round(expenseDiff / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">
                    {reportData.postRetireExpenseMemo}
                  </td>
                </tr>
                <tr className="bg-red-50/60 dark:bg-red-950/40 font-extrabold text-sm">
                  <td className="py-3 px-3 text-red-900 dark:text-red-200">월 잉여금 (수지)</td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                    {(currentSurplus >= 0 ? "+" : "") + Math.round(currentSurplus / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className={`py-3 px-3 text-right font-extrabold ${postRetireSurplus < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {(postRetireSurplus >= 0 ? "+" : "") + Math.round(postRetireSurplus / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-bold">
                    {(surplusDiff < 0 ? "▼ " : "▲ +") + Math.round(surplusDiff / 10000).toLocaleString("ko-KR")}만 원
                  </td>
                  <td className="py-3 px-3 text-[11px] text-red-700 dark:text-red-300 font-bold">
                    {postRetireSurplus < 0 ? `퇴직 즉시 매달 ${Math.abs(Math.round(postRetireSurplus / 10000))}만 원 결손 발생 ⚠️` : "퇴직 후 흑자 수지 유지"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: 재무목표 상세 (순위, 기한, 금액) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-600 rounded-sm"></span>
              <span>3. 재무목표 상세 및 순위·기한·금액 진단</span>
            </h3>
            <span className="text-xs text-slate-400">
              {aiGoals && aiGoals.length > 0
                ? `${evaluatedModelName} AI 정밀 진단 반영`
                : isTemplateBlank
                ? "AFPK AI 페르소나 실시간 진단"
                : "AFPK 공인 표준 실시간 진단"}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-center">순위</th>
                  <th className="py-2.5 px-3">목표 명칭</th>
                  <th className="py-2.5 px-3">목표 기한</th>
                  <th className="py-2.5 px-3 text-right">필요 자금</th>
                  <th className="py-2.5 px-3">준비 자금</th>
                  <th className="py-2.5 px-3 text-right">부족액</th>
                  <th className="py-2.5 px-3 text-center">평가 결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportData.goals.map((g, idx) => {
                  const isRed = g.status.includes("🔴");
                  const isYellow = g.status.includes("🟡");
                  return (
                    <tr key={idx} className={isRed ? "bg-red-50/30 dark:bg-red-950/20" : ""}>
                      <td className="py-2.5 px-3 font-bold text-center">{g.rank}</td>
                      <td className={`py-2.5 px-3 font-semibold ${isRed ? "text-red-700 dark:text-red-300" : "text-slate-800 dark:text-white"}`}>
                        {g.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{g.period}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">{g.needed}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{g.prep}</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${isRed ? "text-red-600 dark:text-red-400 font-extrabold" : isYellow ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {g.shortage}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-block ${
                            isRed
                              ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800"
                              : isYellow
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: AFPK 재무주치의 최종 종합 소견 */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              AFPK 재무주치의 최종 종합 자문 소견
            </h4>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1.5">
            {reportData.opinions.map((op, idx) => (
              <p key={idx} className="flex items-start gap-1.5">
                <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">{idx + 1}.</span>
                <span>{op}</span>
              </p>
            ))}
          </div>
          <div className="pt-2 flex justify-end text-[11px] font-semibold text-slate-500 border-t border-slate-200 dark:border-slate-800">
            {reportData.adviserTitle}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 리포트 세부 항목 작성/수정 인라인 모달 (Option A)                        */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0B2568] to-[#1E3A8A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">✍️</span>
                <div>
                  <h3 className="text-base font-bold">리포트 세부 항목 작성 및 수정</h3>
                  <p className="text-[11px] text-blue-200">
                    입력하신 세부 항목 및 수치는 종합 진단서 문서에 즉시 계산되어 반영됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors text-base"
                title="닫기"
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-2 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab("client")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  modalTab === "client"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                👤 기본 인적사항
              </button>
              <button
                type="button"
                onClick={() => setModalTab("balance")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  modalTab === "balance"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                📊 1. 재무상태표
              </button>
              <button
                type="button"
                onClick={() => setModalTab("cashflow")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  modalTab === "cashflow"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                💵 2. 월간 현금흐름
              </button>
              <button
                type="button"
                onClick={() => setModalTab("goals")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  modalTab === "goals"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                🎯 3. 4대 재무목표
              </button>
              <button
                type="button"
                onClick={() => setModalTab("opinions")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  modalTab === "opinions"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                📋 4. 자문위원 소견
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Tab 1: 기본 인적사항 */}
              {modalTab === "client" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 text-[11px]">
                    고객명과 자문기관, 발행일자를 설정할 수 있습니다. 미입력 시 현재 로그인 계정 및 당일 날짜가 기본 적용됩니다.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        고객 성명 (표기용)
                      </label>
                      <input
                        type="text"
                        value={tempData.customClientName}
                        onChange={(e) => setTempData({ ...tempData, customClientName: e.target.value })}
                        placeholder={displayClientName}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        자문 기관명
                      </label>
                      <input
                        type="text"
                        value={tempData.institution}
                        onChange={(e) => setTempData({ ...tempData, institution: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        발행일자 (사용 날짜)
                      </label>
                      <input
                        type="text"
                        value={tempData.issueDate || todayStr}
                        onChange={(e) => setTempData({ ...tempData, issueDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        자문위원 서명 직함
                      </label>
                      <input
                        type="text"
                        value={tempData.adviserTitle}
                        onChange={(e) => setTempData({ ...tempData, adviserTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 재무상태표 */}
              {modalTab === "balance" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 text-[11px] flex justify-between items-center">
                    <span>자산 4대 항목(현금, 투자, 은퇴, 부동산)과 부채 금액을 입력하면 총자산·순자산·비중이 자동 산출됩니다.</span>
                  </div>

                  <div className="space-y-3">
                    {/* 현금성자산 */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-3 font-bold text-slate-800 dark:text-white">현금성자산</div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.cashName}
                          onChange={(e) => setTempData({ ...tempData, cashName: e.target.value })}
                          placeholder="항목명 (예: 정기예금)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.cashAmount.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, cashAmount: val });
                            }}
                            className="w-full py-1.5 text-right font-bold focus:outline-none"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.cashMemo}
                          onChange={(e) => setTempData({ ...tempData, cashMemo: e.target.value })}
                          placeholder="진단 메모"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </div>
                    </div>

                    {/* 투자자산 */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-3 font-bold text-slate-800 dark:text-white">투자자산</div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.investName}
                          onChange={(e) => setTempData({ ...tempData, investName: e.target.value })}
                          placeholder="항목명 (예: ETF, 주식)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.investAmount.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, investAmount: val });
                            }}
                            className="w-full py-1.5 text-right font-bold focus:outline-none"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.investMemo}
                          onChange={(e) => setTempData({ ...tempData, investMemo: e.target.value })}
                          placeholder="진단 메모"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </div>
                    </div>

                    {/* 은퇴자산 */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-3 font-bold text-slate-800 dark:text-white">은퇴자산</div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.pensionName}
                          onChange={(e) => setTempData({ ...tempData, pensionName: e.target.value })}
                          placeholder="항목명 (예: 퇴직연금, IRP)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.pensionAmount.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, pensionAmount: val });
                            }}
                            className="w-full py-1.5 text-right font-bold focus:outline-none"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.pensionMemo}
                          onChange={(e) => setTempData({ ...tempData, pensionMemo: e.target.value })}
                          placeholder="진단 메모"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </div>
                    </div>

                    {/* 사용자산 */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-3 font-bold text-slate-800 dark:text-white">사용자산 (부동산)</div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.realEstateName}
                          onChange={(e) => setTempData({ ...tempData, realEstateName: e.target.value })}
                          placeholder="항목명 (예: 거주 아파트)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.realEstateAmount.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, realEstateAmount: val });
                            }}
                            className="w-full py-1.5 text-right font-bold focus:outline-none"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.realEstateMemo}
                          onChange={(e) => setTempData({ ...tempData, realEstateMemo: e.target.value })}
                          placeholder="진단 메모"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </div>
                    </div>

                    {/* 부채 */}
                    <div className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-3 font-bold text-red-700 dark:text-red-400">총 부채 (대출금)</div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.debtName}
                          onChange={(e) => setTempData({ ...tempData, debtName: e.target.value })}
                          placeholder="항목명 (예: 담보대출)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.debtAmount.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, debtAmount: val });
                            }}
                            className="w-full py-1.5 text-right font-bold text-red-600 focus:outline-none"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={tempData.debtMemo}
                          onChange={(e) => setTempData({ ...tempData, debtMemo: e.target.value })}
                          placeholder="진단 메모"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: 월간 현금흐름 */}
              {modalTab === "cashflow" && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-[11px]">
                    현재(퇴직 전)와 퇴직 후의 월 수입 및 월 지출을 입력하여 월별 결손액 및 잉여금을 자동 산출합니다.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 퇴직 전 */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                      <h4 className="font-bold text-blue-700 dark:text-blue-300">현재 (퇴직 전) 현금흐름</h4>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">월 수입 합계</label>
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.currentIncome.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, currentIncome: val });
                            }}
                            className="w-full py-1.5 text-right font-bold focus:outline-none"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">월 지출 합계</label>
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.currentExpense.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, currentExpense: val });
                            }}
                            className="w-full py-1.5 text-right font-bold focus:outline-none"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">지출 세부 메모</label>
                        <input
                          type="text"
                          value={tempData.currentExpenseMemo}
                          onChange={(e) => setTempData({ ...tempData, currentExpenseMemo: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </div>
                    </div>

                    {/* 퇴직 후 */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                      <h4 className="font-bold text-amber-700 dark:text-amber-300">퇴직 후 1~3년 현금흐름</h4>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">월 수입 합계 (연금 등)</label>
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.postRetireIncome.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, postRetireIncome: val });
                            }}
                            className="w-full py-1.5 text-right font-bold focus:outline-none text-red-500"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">월 지출 합계</label>
                        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900">
                          <input
                            type="text"
                            value={tempData.postRetireExpense.toLocaleString("ko-KR")}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                              setTempData({ ...tempData, postRetireExpense: val });
                            }}
                            className="w-full py-1.5 text-right font-bold focus:outline-none"
                          />
                          <span className="text-slate-400 ml-1">원</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">퇴직 후 수입/지출 메모</label>
                        <input
                          type="text"
                          value={tempData.postRetireIncomeMemo}
                          onChange={(e) => setTempData({ ...tempData, postRetireIncomeMemo: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: 4대 재무목표 */}
              {modalTab === "goals" && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-200 text-[11px]">
                    4대 재무목표의 명칭, 기한, 필요자금, 준비자금, 부족액을 입력합니다. (신호등 평가는 AFPK 공인 재무설계사 고유 권한으로 자동 판정됩니다)
                  </div>

                  <div className="space-y-3">
                    {tempData.goals.map((g, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
                          <span>{g.rank && g.rank !== "-" ? `${g.rank}순위 목표` : `재무목표 ${idx + 1}`}</span>
                          <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
                            <span className="text-xs">🛡️</span>
                            <span>설계사 진단: {g.status}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={g.name}
                              onChange={(e) => {
                                const newGoals = [...tempData.goals];
                                newGoals[idx].name = e.target.value;
                                setTempData({ ...tempData, goals: newGoals });
                              }}
                              placeholder="목표 명칭"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={g.period}
                              onChange={(e) => {
                                const newGoals = [...tempData.goals];
                                newGoals[idx].period = e.target.value;
                                setTempData({ ...tempData, goals: newGoals });
                              }}
                              placeholder="목표 기한"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500">
                              <input
                                type="text"
                                value={g.needed}
                                onChange={(e) => {
                                  const newGoals = [...tempData.goals];
                                  newGoals[idx].needed = e.target.value;
                                  setTempData({ ...tempData, goals: newGoals });
                                }}
                                placeholder="필요 자금"
                                className="w-full py-1.5 text-right font-bold focus:outline-none bg-transparent text-xs"
                              />
                              <span className="text-slate-400 ml-1 text-xs select-none">원</span>
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500">
                              <input
                                type="text"
                                value={g.prep}
                                onChange={(e) => {
                                  const newGoals = [...tempData.goals];
                                  newGoals[idx].prep = e.target.value;
                                  setTempData({ ...tempData, goals: newGoals });
                                }}
                                placeholder="준비 자금"
                                className="w-full py-1.5 text-right font-bold focus:outline-none bg-transparent text-xs"
                              />
                              <span className="text-slate-400 ml-1 text-xs select-none">원</span>
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500">
                              <input
                                type="text"
                                value={g.shortage}
                                onChange={(e) => {
                                  const newGoals = [...tempData.goals];
                                  newGoals[idx].shortage = e.target.value;
                                  setTempData({ ...tempData, goals: newGoals });
                                }}
                                placeholder="부족액"
                                className="w-full py-1.5 text-right font-bold focus:outline-none bg-transparent text-xs text-red-500"
                              />
                              <span className="text-slate-400 ml-1 text-xs select-none">원</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: 자문위원 소견 */}
              {modalTab === "opinions" && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-[11px]">
                    AFPK 재무주치의 공식 종합 자문 소견 3개 항목을 자유롭게 작성합니다.
                  </div>

                  <div className="space-y-3">
                    {tempData.opinions.map((op, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          자문 소견 {idx + 1}
                        </label>
                        <textarea
                          rows={2}
                          value={op}
                          onChange={(e) => {
                            const newOpinions = [...tempData.opinions];
                            newOpinions[idx] = e.target.value;
                            setTempData({ ...tempData, opinions: newOpinions });
                          }}
                          className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetModalToBenchmark}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  🔄 가상 고객 모범안 채우기
                </button>
                <button
                  type="button"
                  onClick={handleResetModalToBlank}
                  className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  🗑️ 공란으로 비우기
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>리포트에 즉시 반영하기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
