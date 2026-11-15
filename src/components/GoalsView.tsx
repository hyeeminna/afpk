"use client";

import React, { useState } from "react";

interface GoalsViewProps {
  onNavigateStep?: (step: "step1" | "step2" | "step3" | "financial_status" | "goals" | "report" | "settings") => void;
  onOpenTaxModal?: () => void;
  isTemplateBlank?: boolean;
  onLoadSupabaseData?: () => void;
  totalAsset?: string;
  totalDebt?: string;
  monthlyIncome?: string;
  monthlyExpense?: string;
  goalName?: string;
}

export default function GoalsView({
  onNavigateStep,
  onOpenTaxModal,
  isTemplateBlank = false,
  onLoadSupabaseData,
  totalAsset = "",
  totalDebt = "",
  monthlyIncome = "",
  monthlyExpense = "",
  goalName = "",
}: GoalsViewProps) {
  // 고객 실천사항 체크리스트 상태
  const [checklist, setChecklist] = useState({
    irp: true,
    loan: false,
    isa: true,
    inheritance: false,
    review: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0F224A] via-[#162D63] to-[#1E3A8A] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              재무목표 관리 및 맞춤형 솔루션
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-semibold">
              ✦ Supabase 재무목표 상세 연동
            </span>
          </div>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl">
            가상 고객님의 4대 재무목표 타임라인과 달성 가능성을 신호등 카드로 진단하고,
            Supabase의 &apos;실행후&apos; 데이터에 기반한 최적의 은퇴 솔루션을 제시합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenTaxModal}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <span>🏛️</span>
            <span>세무사 상담 (QR)</span>
          </button>
          {onNavigateStep && (
            <button
              type="button"
              onClick={() => onNavigateStep("report")}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>리포트 보기</span>
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
                신규 고객 재무목표 설계 모드 (공란 초기화 상태):{" "}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                고객이 STEP 01에서 희망 재무목표{goalName ? `('${goalName}')` : ""}와 자산·부채 정보를 입력하면, 4대 목표 달성 타임라인(신호등 카드)과 AFPK 솔루션이 자동 연동됩니다.
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

      {/* 2. 4대 재무목표 타임라인 & 신호등 카드 (요청 명세 정확 반영) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>🎯</span>
              <span>4대 재무목표 타임라인 및 달성 가능성 진단</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {!isTemplateBlank
                ? "순위, 기한, 필요자금, 준비자금, 부족액을 종합 평가한 신호등 진단표"
                : "기한, 필요자금, 준비자금, 부족액을 종합 평가한 신호등 진단표 (공란 시 순위 미지정)"}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            진단 기준일: 2026. 10. 31
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. 대출 상환 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{!isTemplateBlank ? "🥇" : "🎯"}</span>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {!isTemplateBlank ? "1순위: 대출 전액 상환" : "대출 전액 상환"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {!isTemplateBlank ? "기한: 1년 내 (퇴직 시점)" : "기한: 직접 설정 (입력 대기)"}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
                !isTemplateBlank
                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
              }`}>
                {!isTemplateBlank && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                {!isTemplateBlank ? "달성 가능 🟢" : "진단 대기 ⚪"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center mb-3">
              <div>
                <span className="text-[10px] text-slate-400 block">필요 자금</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {!isTemplateBlank ? "2억 5,000만" : "0원"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">준비 자금</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {!isTemplateBlank ? "현금 1억 + 퇴직금 1.5억" : "0원"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">부족액</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {!isTemplateBlank ? "0원 (해결)" : "0원"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {!isTemplateBlank ? (
                <>
                  <strong>전문가 평가:</strong> 대출금리(4~5%)가 세후 예금수익률(2.4%)보다 높으므로 퇴직 시 즉시 상환이 유리합니다.
                  상환 완료 시 매월 원리금 185만 원(이자 월 약 104만 원) 부담이 영구적으로 사라집니다.
                </>
              ) : (
                "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다."
              )}
            </p>
          </div>

          {/* 2. 장남 결혼자금 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{!isTemplateBlank ? "🥈" : "🎯"}</span>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {!isTemplateBlank ? "2순위: 장남 결혼자금 지원" : "자녀 결혼자금 지원"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {!isTemplateBlank ? "기한: 2년 내" : "기한: 직접 설정 (입력 대기)"}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
                !isTemplateBlank
                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
              }`}>
                {!isTemplateBlank && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                {!isTemplateBlank ? "달성 가능 🟢" : "진단 대기 ⚪"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center mb-3">
              <div>
                <span className="text-[10px] text-slate-400 block">필요 자금</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {!isTemplateBlank ? "7,000만 원" : "0원"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">준비 자금</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {!isTemplateBlank ? "현금 예금 2억 중 활용" : "0원"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">부족액</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {!isTemplateBlank ? "0원 (해결)" : "0원"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {!isTemplateBlank ? (
                <>
                  <strong>전문가 평가:</strong> 보유 정기예금 2억 원 중 7,000만 원을 결혼자금 전용 단기 정기예금으로 분리하여 안전하게 지원 가능합니다.
                </>
              ) : (
                "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다."
              )}
            </p>
          </div>

          {/* 3. 은퇴 생활비 확보 */}
          <div className={`p-5 rounded-2xl bg-white dark:bg-[#11192E] shadow-sm relative overflow-hidden ${
            !isTemplateBlank
              ? "border-2 border-red-300 dark:border-red-800"
              : "border border-slate-200 dark:border-slate-800"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{!isTemplateBlank ? "🥉" : "🎯"}</span>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {!isTemplateBlank ? "3순위: 은퇴 생활비 월 300만 원 확보" : "은퇴 생활비 월 300만 원 확보"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {!isTemplateBlank ? "기한: 61세 ~ 80세 (20년간)" : "기한: 직접 설정 (입력 대기)"}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
                !isTemplateBlank
                  ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-400 dark:border-red-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
              }`}>
                {!isTemplateBlank && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
                {!isTemplateBlank ? "위험 경보 🔴" : "진단 대기 ⚪"}
              </span>
            </div>

            <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl text-center mb-3 ${
              !isTemplateBlank ? "bg-red-50/50 dark:bg-red-950/30" : "bg-slate-50 dark:bg-slate-800/50"
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 block">필요 자금</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {!isTemplateBlank ? "약 6억 8,800만" : "0원"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">준비 자금</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {!isTemplateBlank ? "약 3억 7,000만" : "0원"}
                </span>
              </div>
              <div>
                <span className={`text-[10px] block font-semibold ${!isTemplateBlank ? "text-red-600 dark:text-red-400" : "text-slate-400"}`}>
                  부족액
                </span>
                <span className={`text-xs font-extrabold ${!isTemplateBlank ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-white"}`}>
                  {!isTemplateBlank ? "약 3억 2,000만 ⚠️" : "0원"}
                </span>
              </div>
            </div>

            <p className={`text-[11px] leading-relaxed ${!isTemplateBlank ? "text-red-700 dark:text-red-300" : "text-slate-600 dark:text-slate-300"}`}>
              {!isTemplateBlank ? (
                <>
                  <strong>긴급 진단:</strong> 대출 상환 및 결혼자금 지출 후 남은 금융자산만으로는 퇴직 후 소득 공백기(61~64세)와 70대 이후 생활비에 3.2억 원 결손이 발생합니다.
                  따라서 <u>퇴직급여 IRP 연금 분할 수령</u>과 <u>71세 주택연금 연계</u> 대안이 반드시 결합되어야 합니다.
                </>
              ) : (
                "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다."
              )}
            </p>
          </div>

          {/* 4. 상속 대비 */}
          <div className={`p-5 rounded-2xl bg-white dark:bg-[#11192E] shadow-sm relative overflow-hidden ${
            !isTemplateBlank
              ? "border border-amber-300 dark:border-amber-700"
              : "border border-slate-200 dark:border-slate-800"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{!isTemplateBlank ? "🏅" : "🎯"}</span>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {!isTemplateBlank ? "4순위: 상가주택 상속 대비" : "상가주택 상속 대비"}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {!isTemplateBlank ? "기한: 4년 내 (예상 시점)" : "기한: 직접 설정 (입력 대기)"}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${
                !isTemplateBlank
                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
              }`}>
                {!isTemplateBlank && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                {!isTemplateBlank ? "사전 합의 필요 🟡" : "진단 대기 ⚪"}
              </span>
            </div>

            <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl text-center mb-3 ${
              !isTemplateBlank ? "bg-amber-50/50 dark:bg-amber-950/20" : "bg-slate-50 dark:bg-slate-800/50"
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 block">예상 지분 가치</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {!isTemplateBlank ? "약 5억 원 (1/3)" : "0원"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">예상 상속세</span>
                <span className={`text-xs font-bold ${!isTemplateBlank ? "text-amber-700 dark:text-amber-300" : "text-slate-800 dark:text-white"}`}>
                  {!isTemplateBlank ? "약 7,760만 원" : "0원"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">납부 재원</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {!isTemplateBlank ? "연부연납 + 임대수입" : "미정"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {!isTemplateBlank ? (
                <>
                  <strong>전문가 평가:</strong> 형제 3명과 분할 비율을 사전 합의하여 서면화해야 분쟁을 막을 수 있습니다.
                  본인 상속세 7,760만 원은 은퇴자금을 헐지 않고, 연부연납(5년 분할납부)과 상가 임대수입으로 충당하는 전략을 권장합니다.
                </>
              ) : (
                "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Supabase '실행후' 테이블 연계: 현재 상태 유지 vs 솔루션 실행 후 비교 */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>⚖️</span>
              <span>대안 솔루션 실행 전후 비교 (현재 상태 유지 vs 플랜 실행 후)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {!isTemplateBlank
                ? "Supabase '실행후' 테이블 실데이터 연동: AFPK 권고 플랜 적용 시 재무 구조 변화"
                : "신규 고객 직접 입력 데이터 기반 대안 솔루션 비교 분석"}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            !isTemplateBlank
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800"
              : "text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
          }`}>
            {!isTemplateBlank ? "✓ 100세 종신 은퇴자금 확보" : "플랜 수립 대기"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/70 dark:bg-slate-900/60">
                <th className="py-2.5 px-3">핵심 재무 항목</th>
                <th className="py-2.5 px-3">현재 상태 유지 시</th>
                <th className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                  솔루션 실행 후 (AFPK 플랜)
                </th>
                <th className="py-2.5 px-3">기대 효과 및 근거</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                  아파트 담보대출
                </td>
                <td className="py-2.5 px-3 text-red-500 font-semibold">
                  {!isTemplateBlank ? "2억 5,000만 원 (연 4%, 월 185만 원)" : (totalDebt ? totalDebt + "원" : "0원")}
                </td>
                <td className="py-2.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                  {!isTemplateBlank ? "0원 (전액 상환 완료)" : "0원 (상환 완료 목표)"}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-slate-500">
                  {!isTemplateBlank ? "퇴직 직후 원리금 부담 영구 제거, 이자 2,100만 원 절감" : "원리금 부담 제거 및 이자 절감"}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                  퇴직 후 월 지출
                </td>
                <td className="py-2.5 px-3 text-red-500 font-semibold">
                  {!isTemplateBlank ? "637만 원 / 월 (대출 원리금 185만 포함)" : (monthlyExpense ? monthlyExpense + "원 / 월" : "0원")}
                </td>
                <td className="py-2.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                  {!isTemplateBlank ? "452만 원 / 월 (▼ 185만 원 감소)" : "-"}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-slate-500">
                  {!isTemplateBlank ? "대출 상환으로 고정지출 30% 대폭 절감" : "-"}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                  은퇴 후 월 수입
                </td>
                <td className="py-2.5 px-3 text-red-500 font-semibold">
                  {!isTemplateBlank ? "45만 원 (이자·배당만 발생, 소득 절벽)" : "-"}
                </td>
                <td className="py-2.5 px-3 font-extrabold text-blue-600 dark:text-blue-400">
                  {!isTemplateBlank ? "300만 원 / 월 (안정적 연금 수령)" : "-"}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-blue-700 dark:text-blue-300">
                  {!isTemplateBlank ? "IRP 250만 + 연금저축 50만 원 (64세부터 국민연금 85만 원 합산)" : "-"}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                  주식 · ETF (4,170만 원)
                </td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  {!isTemplateBlank ? "일반 증권위탁계좌 (과세)" : "-"}
                </td>
                <td className="py-2.5 px-3 font-bold text-purple-600 dark:text-purple-400">
                  {!isTemplateBlank ? "중개형 ISA 계좌로 이전" : "-"}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-slate-500">
                  {!isTemplateBlank ? "순이익 200만 원 비과세 및 초과분 9.9% 분리과세 혜택" : "-"}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                  71세 이후 은퇴 생활비
                </td>
                <td className="py-2.5 px-3 text-red-500 font-semibold">
                  {!isTemplateBlank ? "금융자산 고갈로 생활비 결손 위험" : "-"}
                </td>
                <td className="py-2.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                  {!isTemplateBlank ? "수원 아파트 주택연금 (월 297만 원)" : "-"}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                  {!isTemplateBlank ? "10억 아파트 유동화로 부부 종신까지 월 300만 수준 완벽 유지" : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 고객 실천사항 Action Plan 체크리스트 (Supabase ⑧번 항목) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>📋</span>
              <span>은퇴 준비 고객 실천사항 (Action Plan)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              안전한 은퇴를 위해 순차적으로 완료해야 할 5대 실행 과제
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            진행률: {completedCount} / 5 완료 ({Math.round((completedCount / 5) * 100)}%)
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checklist.irp}
              onChange={() => toggleCheck("irp")}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
              <span className={`font-semibold ${checklist.irp ? "line-through text-slate-400" : "text-slate-800 dark:text-white"}`}>
                퇴직 전 IRP 계좌 개설 및 퇴직급여 이전 신청 (2.5억 원)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                퇴직소득세 30% 감면 혜택을 위해 주거래 은행/증권사에 IRP 계좌를 개설합니다.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checklist.loan}
              onChange={() => toggleCheck("loan")}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
              <span className={`font-semibold ${checklist.loan ? "line-through text-slate-400" : "text-slate-800 dark:text-white"}`}>
                아파트 담보대출 중도상환수수료 면제 시점 확인 후 상환일 확정
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                현금 1억 + 퇴직금 1.5억으로 2.5억 원 전액 상환 일정을 수립합니다.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checklist.isa}
              onChange={() => toggleCheck("isa")}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
              <span className={`font-semibold ${checklist.isa ? "line-through text-slate-400" : "text-slate-800 dark:text-white"}`}>
                증권계좌의 주식(삼성전자) 및 미국 ETF를 중개형 ISA로 이전
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                배당소득세 절세 및 비과세 한도 200만 원 적용을 위해 계좌를 이전합니다.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checklist.inheritance}
              onChange={() => toggleCheck("inheritance")}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
              <span className={`font-semibold ${checklist.inheritance ? "line-through text-slate-400" : "text-slate-800 dark:text-white"}`}>
                형제와 지방 상가주택 상속 분할 비율 사전 합의 및 서면화
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                상속세 연부연납 및 임대수익 배분 기준을 가족 간에 명문화합니다.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checklist.review}
              onChange={() => toggleCheck("review")}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
              <span className={`font-semibold ${checklist.review ? "line-through text-slate-400" : "text-slate-800 dark:text-white"}`}>
                반기(6개월)당 1회 연금 수령액과 포트폴리오 정기 리밸런싱 점검
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                은퇴 후 인플레이션과 지출 변동에 맞춰 세무사 및 AI 주치의와 정기 점검을 실시합니다.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
