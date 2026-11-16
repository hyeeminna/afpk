"use client";

import React, { useState } from "react";
import { evaluateFinancialGoals, EvaluatedGoalItem, SolutionComparisonItem } from "@/lib/goalEvaluation";

interface GoalsViewProps {
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
  emergencyFund = "",
  goalName = "",
  goalAmount = "",
  goalDate = "",
  aiGoals,
  aiSolutions,
  isAiEvaluating = false,
  onTriggerAiEvaluation,
}: GoalsViewProps) {
  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\. /g, ". ").replace(/\.$/, "");

  // AFPK 수석 은퇴설계 AI (Gemini 1.5 Flash) 페르소나 기반 4대 재무목표 평가 엔진 실행
  const { goals, solutions } = evaluateFinancialGoals({
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

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0F224A] via-[#162D63] to-[#1E3A8A] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              재무목표 관리 및 맞춤형 솔루션
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-semibold">
              ✦ {aiGoals && aiGoals.length > 0 ? "Gemini 1.5 Flash AI 정밀 진단 반영됨" : (isTemplateBlank ? "AFPK AI 페르소나 실시간 진단" : "AFPK 공인 표준 실시간 진단")}
            </span>
          </div>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl">
            {aiGoals && aiGoals.length > 0
              ? "Gemini 1.5 Flash AI 재무주치의가 고객님의 재무 데이터와 상담 맥락을 바탕으로 4대 재무목표와 달성 가능성을 정밀하게 재평가했습니다."
              : isTemplateBlank
              ? "고객님께서 직접 입력하신 자산·부채·현금흐름을 바탕으로 AFPK 공인 재무설계 표준 프로세스에 따라 4대 재무목표 달성 가능성을 실시간 진단합니다."
              : "고객님의 자산·부채·현금흐름 데이터를 바탕으로 AFPK·CFP 6단계 표준 프로세스에 따라 최적의 은퇴 솔루션과 신호등 카드를 제시합니다."}
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
                  <span>Gemini 1.5 Flash 진단 중...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Gemini 1.5 Flash AI 재진단</span>
                </>
              )}
            </button>
          )}
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
                신규 고객 재무목표 실시간 진단 모드:{" "}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                고객이 STEP 01에서 입력한 부채·자산·월소득·지출 및 희망목표{goalName ? `('${goalName}')` : ""}가 반영되어 4대 목표 달성 가능성(신호등 상태 및 전문가 평가)이 즉시 산출되었습니다.
              </span>
            </div>
          </div>
          {onLoadSupabaseData && (
            <button
              type="button"
              onClick={onLoadSupabaseData}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex-shrink-0 transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              🔄 Supabase 모범안 불러오기
            </button>
          )}
        </div>
      )}

      {/* 2. 4대 재무목표 타임라인 & 신호등 카드 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>🎯</span>
              <span>4대 재무목표 타임라인 및 달성 가능성 진단</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              순위, 기한, 필요자금, 준비자금, 부족액을 AFPK AI 페르소나 지침에 따라 종합 평가한 신호등 진단표
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            진단 기준일: {isTemplateBlank ? todayStr : "2026. 10. 31"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g, idx) => {
            const isGreen = g.statusCode === "green";
            const isYellow = g.statusCode === "yellow";
            const isRed = g.statusCode === "red";

            const badgeBg = isGreen
              ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
              : isYellow
              ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
              : isRed
              ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-400 dark:border-red-700"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700";

            const borderCard = isRed
              ? "border-2 border-red-300 dark:border-red-800"
              : isYellow
              ? "border border-amber-300 dark:border-amber-700"
              : "border border-slate-200 dark:border-slate-800";

            return (
              <div
                key={g.id || idx}
                className={`p-5 rounded-2xl bg-white dark:bg-[#11192E] shadow-sm relative overflow-hidden flex flex-col justify-between ${borderCard}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅"}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                          {g.rank}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          기한: {g.period}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${badgeBg}`}>
                      {isGreen && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                      {isRed && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
                      {isYellow && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                      {g.status}
                    </span>
                  </div>

                  <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl text-center mb-3 ${
                    isRed ? "bg-red-50/50 dark:bg-red-950/30" : isYellow ? "bg-amber-50/50 dark:bg-amber-950/20" : "bg-slate-50 dark:bg-slate-800/50"
                  }`}>
                    <div>
                      <span className="text-[10px] text-slate-400 block">필요 자금</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        {g.needed}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">준비 자금</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {g.prep}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[10px] block font-semibold ${isRed ? "text-red-600 dark:text-red-400" : isYellow ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        부족액
                      </span>
                      <span className={`text-xs font-extrabold ${isRed ? "text-red-600 dark:text-red-400" : isYellow ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {g.shortage}
                      </span>
                    </div>
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 ${
                  isRed ? "text-red-700 dark:text-red-300" : "text-slate-600 dark:text-slate-300"
                }`}>
                  {g.expertOpinion}
                </p>
              </div>
            );
          })}
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
              {isTemplateBlank
                ? "신규 고객 직접 입력 데이터 기반 AFPK 공인 재무설계 대안 솔루션 비교 분석"
                : "Supabase '실행후' 테이블 실데이터 연동: AFPK 권고 플랜 적용 시 재무 구조 변화"}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            !isTemplateBlank
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800"
              : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800"
          }`}>
            {isTemplateBlank ? "✓ AFPK 맞춤 솔루션 적용" : "✓ 100세 종신 은퇴자금 확보"}
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
              {solutions.map((s, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                    {s.item}
                  </td>
                  <td className="py-2.5 px-3 text-red-500 font-semibold">
                    {s.before}
                  </td>
                  <td className="py-2.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                    {s.after}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">
                    {s.effect}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Action Navigation */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onNavigateStep && onNavigateStep("financial_status")}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
        >
          ← 이전 (내 재무현황 종합 분석표)
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
            onClick={() => onNavigateStep && onNavigateStep("report")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex-1 sm:flex-initial"
          >
            리포트(진단 보고서) 확인하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
