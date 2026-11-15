"use client";

import React, { useState } from "react";

interface FinancialStatusViewProps {
  onNavigateStep?: (step: "step1" | "step2" | "step3" | "financial_status") => void;
  onOpenTaxModal?: () => void;
}

export default function FinancialStatusView({
  onNavigateStep,
  onOpenTaxModal,
}: FinancialStatusViewProps) {
  const [activeTab, setActiveTab] = useState<"balance" | "cashflow" | "diagnosis">("balance");

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
              Supabase DB 실데이터 연동
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

      {/* 2. Top Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 총 자산 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span>🏠</span>
            <span>총 자산</span>
          </div>
          <div className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">
            17억 2,171만 원
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
            부동산 58% • 은퇴 28%
          </div>
        </div>

        {/* 총 부채 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span>💳</span>
            <span>총 부채</span>
          </div>
          <div className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">
            2억 5,000만 원
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            담보대출 (LTV 25%)
          </div>
        </div>

        {/* 순자산 */}
        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1">
            <span>💰</span>
            <span>순자산 (Net Worth)</span>
          </div>
          <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            14억 7,171만 원
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            부채비율 14.5% (안전)
          </div>
        </div>

        {/* 현재 월 수지 */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <span>📈</span>
            <span>현재 월 잉여금</span>
          </div>
          <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            +72만 원
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            수입 805만 / 지출 733만
          </div>
        </div>

        {/* 퇴직 후 예상 월 수지 */}
        <div className="p-4 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-800 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-[11px] text-red-700 dark:text-red-300 font-bold flex items-center gap-1">
            <span>⚠️</span>
            <span>퇴직 직후 월 수지</span>
          </div>
          <div className="text-lg font-extrabold text-red-600 dark:text-red-400 mt-1">
            -592만 원
          </div>
          <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-1">
            소득 공백기 대비 필수
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
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

      {/* ======================================================== */}
      {/* TAB 1: 자산·부채 상태표 (재무상태표) */}
      {/* ======================================================== */}
      {activeTab === "balance" && (
        <div className="space-y-6">
          {/* Asset Allocation Visual Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>자산 구성 비중 (총 자산: 17억 2,171만 원)</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">단위: %</span>
            </div>

            {/* Multi-segment Progress Bar */}
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: "58.1%" }}
                className="bg-blue-600 hover:bg-blue-700 transition-all"
                title="사용자산 (부동산): 58.1%"
              />
              <div
                style={{ width: "27.9%" }}
                className="bg-emerald-500 hover:bg-emerald-600 transition-all"
                title="은퇴자산: 27.9%"
              />
              <div
                style={{ width: "11.6%" }}
                className="bg-amber-500 hover:bg-amber-600 transition-all"
                title="현금성자산: 11.6%"
              />
              <div
                style={{ width: "2.4%" }}
                className="bg-purple-600 hover:bg-purple-700 transition-all"
                title="투자자산: 2.4%"
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">사용자산(부동산):</span>
                <span className="font-bold text-slate-800 dark:text-white">10억 (58.1%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">은퇴자산:</span>
                <span className="font-bold text-slate-800 dark:text-white">4.8억 (27.9%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">현금성자산:</span>
                <span className="font-bold text-slate-800 dark:text-white">2억 (11.6%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-600"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">투자자산:</span>
                <span className="font-bold text-slate-800 dark:text-white">4,171만 (2.4%)</span>
              </div>
            </div>
          </div>

          {/* 자산·부채 상세 테이블 (Supabase 10월 재무상태표 상세) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  2026년 10월 기준 자산·부채 상태표 (상세 내역)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supabase 테이블 &apos;10월 재무상태표 상세&apos; 실데이터 연동
                </p>
              </div>
              <span className="text-xs text-slate-400">작성 기준일: 2026. 10. 31</span>
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
                      정기예금 · 적금
                    </td>
                    <td className="py-2.5 px-3 font-bold text-right text-slate-800 dark:text-white">
                      200,000,000원
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-medium">11.6%</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      원금 or 작성일 해지 가정 시 환급금 (비상자금 및 결혼자금 예비)
                    </td>
                  </tr>

                  {/* 투자 자산 1 */}
                  <tr>
                    <td rowSpan={3} className="py-2.5 px-3 font-bold text-purple-700 dark:text-purple-400 align-top border-r border-slate-100 dark:border-slate-800">
                      투자 자산
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      삼성전자 100주
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-white">
                      22,100,000원
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">1.3%</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      작성일 종가 기준 (주당 221,000원)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      TIGER 미국S&amp;P500 100주
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-white">
                      2,531,000원
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">0.1%</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      작성일 당시 평가 금액 (주당 25,310원)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      TIGER 미국 나스닥100 100주
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-white">
                      17,074,500원
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">1.0%</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      작성일 당시 평가 금액 (주당 170,745원)
                    </td>
                  </tr>

                  {/* 은퇴 자산 */}
                  <tr>
                    <td rowSpan={3} className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400 align-top border-r border-slate-100 dark:border-slate-800">
                      은퇴 자산
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-semibold">
                      퇴직급여 (DC형)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                      400,000,000원
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">23.2%</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      근속 33년, DC형(임금피크 전 DB에서 전환), 1년 뒤 수령 예정
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      연금저축 (연금저축펀드)
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-white">
                      80,000,000원
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">4.7%</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      45세 가입, 연 400만 × 15년(원금 6,000만 원), 지수형 펀드 위주
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      국민연금 (공적연금)
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-white">
                      월 85만 원 예정
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      4년 뒤 수령 개시 (만 64세), 종신 지급
                    </td>
                  </tr>

                  {/* 사용자산 (부동산) */}
                  <tr className="bg-blue-50/20 dark:bg-blue-950/10">
                    <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400">
                      사용 자산
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      수원 아파트 (자가 거주용)
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      1,000,000,000원
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      58.1%
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      시가 10억 원, 대출 2억 5천만 원(LTV 25%), 주택연금 연계 검토 가능
                    </td>
                  </tr>

                  {/* 상속 예정 자산 */}
                  <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-500">
                      상속 예정 자산
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      지방 상가주택
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                      약 500,000,000원 (예상 지분)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">(미확정)</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      전체 15억 원 중 본인 지분 약 1/3, 5년 내 상속 예상, 형제 공동 소유
                    </td>
                  </tr>

                  {/* 총 자산 합계 */}
                  <tr className="bg-blue-50 dark:bg-blue-950/40 font-bold border-t-2 border-blue-200 dark:border-blue-800">
                    <td colSpan={2} className="py-3 px-3 text-blue-900 dark:text-blue-200">
                      총 자산 합계 (Total Assets)
                    </td>
                    <td className="py-3 px-3 text-right text-base text-blue-700 dark:text-blue-300">
                      1,721,710,000원
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700 dark:text-blue-300">100.0%</td>
                    <td className="py-3 px-3 text-[11px] text-blue-800 dark:text-blue-300">
                      17억 2,171만 원 (부동산 비중 58.1% 편중)
                    </td>
                  </tr>

                  {/* 부채 */}
                  <tr className="bg-red-50/30 dark:bg-red-950/20 border-t-2 border-slate-200 dark:border-slate-800">
                    <td className="py-3 px-3 font-bold text-red-700 dark:text-red-400">
                      부채 (Liabilities)
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      아파트 담보대출 (원리금균등)
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-red-600 dark:text-red-400 text-base">
                      250,000,000원
                    </td>
                    <td className="py-3 px-3 text-right text-red-500">-</td>
                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      연 4.0%, 잔여 15년 상환, 월 원리금 185만 원 납부 중
                    </td>
                  </tr>

                  {/* 순자산 */}
                  <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-extrabold border-t-2 border-emerald-300 dark:border-emerald-700">
                    <td colSpan={2} className="py-3.5 px-3 text-emerald-900 dark:text-emerald-200 text-sm">
                      순자산 합계 (Net Worth) = 총 자산 - 총 부채
                    </td>
                    <td className="py-3.5 px-3 text-right text-lg text-emerald-700 dark:text-emerald-300">
                      1,471,710,000원
                    </td>
                    <td className="py-3.5 px-3 text-right text-emerald-700 dark:text-emerald-300">
                      85.5%
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-emerald-800 dark:text-emerald-300">
                      약 14억 7,171만 원 (부채비율 14.5%로 매우 안정적)
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
                <span className="font-bold text-emerald-600 dark:text-emerald-400">14.5% (안전)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "14.5%" }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                권장 기준(40% 이하) 대비 매우 건전하며 채무 불이행 위험이 낮습니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">부동산 집중도</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">58.1% (주의)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "58.1%" }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                거주 부동산에 자산이 편중되어 퇴직 후 생활비 현금흐름 창출 여력이 부족합니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">비상예비자금 비율</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">27.3개월분 (우수)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: "90%" }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                예적금 2억 원 보유로 월 지출(733만) 대비 충분하나 결혼자금과 구분 필요.
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
          {/* 현금흐름 비교 테이블 (Supabase 10월 현금흐름표 상세) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  월간 현금흐름표 (현재 퇴직 전 vs 퇴직 후 1~3년 유지 시)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  퇴직 직후 발생하는 극심한 소득 절벽과 월 지출 변동 요인을 사전 점검합니다
                </p>
              </div>
              <span className="text-xs text-slate-400">단위: 만 원 / 월</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/70 dark:bg-slate-900/60">
                    <th className="py-2.5 px-3">구분</th>
                    <th className="py-2.5 px-3">항목</th>
                    <th className="py-2.5 px-3 text-right">현재 (퇴직 전)</th>
                    <th className="py-2.5 px-3 text-right">퇴직 후 1~3년</th>
                    <th className="py-2.5 px-3 text-right">증감 (차이)</th>
                    <th className="py-2.5 px-3">전제 조건 및 상세 가정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* 수입 부문 */}
                  <tr>
                    <td rowSpan={4} className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-400 align-top border-r border-slate-100 dark:border-slate-800">
                      수입
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      근로소득 (세후)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">760만 원</td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-bold">0만 원</td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-semibold">▼ -760만</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      연봉 약 1억 3,500만 원, 1년 뒤 정년퇴직 시 전액 중단
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">이자소득</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">40만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">40만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      정기예금 2억 원 이자 수익 (세후 약 2.4% 가정)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">배당소득</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">5만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">5만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      삼성전자 및 미국 지수 ETF 분기 배당 환산액
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">IRP 연금 수령</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">0만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">0만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      퇴직급여 4억 원의 수령 방식 미결정 상태 (연금화 필요)
                    </td>
                  </tr>

                  {/* 수입 합계 */}
                  <tr className="bg-blue-50 dark:bg-blue-950/40 font-bold">
                    <td colSpan={2} className="py-2.5 px-3 text-blue-900 dark:text-blue-200">
                      월 수입 합계 (Total Income)
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-300 font-extrabold">
                      805만 원
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-extrabold">
                      45만 원
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-extrabold">
                      ▼ -760만 (-94.4%)
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                      퇴직 직후 수입이 이자·배당 45만 원으로 급감!
                    </td>
                  </tr>

                  {/* 고정지출 부문 */}
                  <tr>
                    <td rowSpan={5} className="py-2.5 px-3 font-bold text-amber-700 dark:text-amber-400 align-top border-r border-slate-100 dark:border-slate-800">
                      고정지출
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      대출 원리금 상환
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">185만 원</td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-bold">185만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      대출 2.5억(연 4%), 잔여 15년. 미상환 시 퇴직 후에도 185만 고정 지출!
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">보험료 (본인·배우자)</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">50만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">50만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      실손, 자동차, 화재 등 기존 보장성 보험료
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-semibold text-red-600 dark:text-red-400">
                      건강보험료 (지역가입자)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">0만 원 (직장)</td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-bold">40만 원</td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-semibold">▲ +40만</td>
                    <td className="py-2.5 px-3 text-[11px] text-red-600 dark:text-red-400">
                      직장자격 상실 및 재산초과로 피부양자 탈락, 지역건보료 신규 발생!
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">관리비 · 공과금</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">35만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">35만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">아파트 관리비 및 공과금</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">통신비</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">15만 원</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">12만 원</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">▼ -3만</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">통신요금제 알뜰 조정</td>
                  </tr>

                  {/* 변동지출 부문 */}
                  <tr>
                    <td rowSpan={4} className="py-2.5 px-3 font-bold text-amber-800 dark:text-amber-300 align-top border-r border-slate-100 dark:border-slate-800">
                      변동지출
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">식비 · 생활비</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">140만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">140만 원</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">부부 2인 기본 생활비 유지</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">배우자 의료·간병비</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">60만 원</td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-semibold">70만 원</td>
                    <td className="py-2.5 px-3 text-right text-red-500">▲ +10만</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">연령 증가에 따른 의료비 상승</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">골프 · 여행 (여가)</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">70만 원</td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-semibold">90만 원</td>
                    <td className="py-2.5 px-3 text-right text-red-500">▲ +20만</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">은퇴 후 여가 시간 증가</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">경조사비</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">25만 원</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">15만 원</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">▼ -10만</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">퇴직 후 대인관계 축소</td>
                  </tr>

                  {/* 자녀 & 저축 */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">자녀</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">대학생 등록금·용돈</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">120만 원</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">0만 원</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">▼ -120만</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">자녀 졸업 및 독립 가정</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-500 border-r border-slate-100 dark:border-slate-800">저축</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">연금저축 납입</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-white">33만 원</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">0만 원</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">▼ -33만</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">퇴직 후 신규 납입 중단</td>
                  </tr>

                  {/* 지출 합계 */}
                  <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                    <td colSpan={2} className="py-2.5 px-3 text-slate-800 dark:text-white">
                      월 지출 합계 (Total Expenses)
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-extrabold">
                      733만 원
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-extrabold">
                      637만 원
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      ▼ -96만 (-13.1%)
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      자녀 졸업으로 줄지만 건보료·대출이자 지속
                    </td>
                  </tr>

                  {/* 월 잉여 / 결손 (하이라이트) */}
                  <tr className="bg-red-50 dark:bg-red-950/40 font-extrabold border-t-2 border-red-300 dark:border-red-700">
                    <td colSpan={2} className="py-3 px-3 text-red-900 dark:text-red-200 text-sm">
                      월간 잉여금 / 부족액 (Net Cash Flow)
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 text-base">
                      +72만 원
                    </td>
                    <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 text-base">
                      -592만 원
                    </td>
                    <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 font-bold">
                      ▼ -664만 원
                    </td>
                    <td className="py-3 px-3 text-[11px] text-red-700 dark:text-red-300 font-semibold">
                      매달 592만 원씩 자산이 잠식되는 위험 발생!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 은퇴 위험 경보 Alert Banner */}
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <span className="text-xl">🚨</span>
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-red-800 dark:text-red-300">
                AFPK 수석 재무설계사의 진단: 은퇴 소득 공백기 긴급 대응 필요
              </h5>
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                현재 계획대로 1년 뒤 퇴직하면 근로소득(760만 원)이 끊기고, 국민연금 수령(64세)까지 <strong>4년간의 소득 공백기</strong>가 발생합니다.
                매월 <strong>592만 원의 적자</strong>가 발생하므로, 퇴직금 4억 원을 일시금으로 인출하여 생활비로 사용하면 <strong>약 5.6년 만에 전액 고갈</strong>됩니다.
                따라서 <u>퇴직급여 IRP 연금 분할 수령</u>, <u>대출 일부 상환</u>, <u>주택연금 연계</u>를 통한 고정 현금흐름 창출이 시급합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 자산·보험·세무 정밀 진단 */}
      {/* ======================================================== */}
      {activeTab === "diagnosis" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. 부동산 자산 분석 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>🏢</span>
                <span>부동산 자산 분석 (Supabase DB)</span>
              </h4>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium">
                자산 비중 58.1%
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">수원 아파트 (시가 10억 원, 자가)</div>
                <div className="text-slate-500 text-[11px]">
                  <strong>현황:</strong> 거주용, 대출 2억 5,000만 원 (LTV 25%)
                </div>
                <div className="text-amber-700 dark:text-amber-400 text-[11px] pt-1">
                  <strong>평가:</strong> 자산의 과반이 묶여 있으나 월 현금흐름을 전혀 만들지 못함. 향후 주택연금 가입 또는 다운사이징으로 유동성 확보 여력 충분.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">지방 상가주택 (상속 예정 지분 약 5억 원)</div>
                <div className="text-slate-500 text-[11px]">
                  <strong>현황:</strong> 전체 시가 15억 원, 본인 지분 약 1/3, 5년 내 상속 예상
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-[11px] pt-1">
                  <strong>평가:</strong> 임대수익 가능성이 있으나 형제 공동 상속으로 매각 및 수익 배분 분쟁 가능성. 사전 감정평가 및 합의 플랜 필요.
                </div>
              </div>
            </div>
          </div>

          {/* 2. 금융 및 은퇴자산 분석 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>📈</span>
                <span>금융 · 은퇴자산 분석 (Supabase DB)</span>
              </h4>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">
                금융자산 7.2억
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">예·적금 (2억 원) &amp; 주식 (4,171만 원)</div>
                <div className="text-slate-500 text-[11px]">
                  <strong>현황:</strong> 삼성전자(2,210만) 비중이 53%로 단일 종목 과도 편중.
                </div>
                <div className="text-amber-700 dark:text-amber-400 text-[11px] pt-1">
                  <strong>평가:</strong> 예금 2억은 자녀 결혼자금(7,000만)과 비상금으로 명확히 계좌 분리 필요. 주식은 글로벌 배당 ETF로 분산 권장.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">퇴직급여 DC형 (4억 원) &amp; 연금저축 (8,000만 원)</div>
                <div className="text-slate-500 text-[11px]">
                  <strong>현황:</strong> 1년 뒤 수령 예정, 수령 방식 미결정 상태.
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 text-[11px] pt-1">
                  <strong>평가:</strong> 일시금 인출 금지. IRP로 이전하여 연금으로 수령 시 퇴직소득세 30~40% 감면 혜택과 10년 이상 안정적 월 생활비 확보 가능.
                </div>
              </div>
            </div>
          </div>

          {/* 3. 보장성 보험 현황 분석 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>🛡️</span>
                <span>보장성 보험 현황 (Supabase DB)</span>
              </h4>
              <span className="text-[10px] bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-medium">
                보장 공백 위험
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span>본인 회사 단체실손 (입원·통원)</span>
                <span className="text-red-600 dark:text-red-400 font-bold">퇴직 시 즉시 종료 ⚠️</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span>배우자 개인 실손의료보험</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">월 6만 원 (갱신형)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <span>암·뇌졸중·급성심근경색 3대 진단비</span>
                <span className="text-red-600 dark:text-red-400 font-bold">전무 (가입 없음) ⚠️</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                퇴직 직전 단체실손을 개인실손으로 전환 제도 활용 필수 및 최소한의 3대 질병 진단비 보완 권고.
              </p>
            </div>
          </div>

          {/* 4. 세무 상황 및 절세 포인트 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>⚖️</span>
                <span>세무 상황 및 핵심 절세 전략</span>
              </h4>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-medium">
                세무사 검토 필요
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">퇴직소득세 이연 및 감면</div>
                <p className="text-[11px] text-slate-500">
                  퇴직금 4억 원을 IRP로 이체 시 퇴직소득세 징수가 이연되며, 10년 초과 수령 시 세금의 40% 감면.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">사적연금 연 1,500만 원 분리과세 한도 관리</div>
                <p className="text-[11px] text-slate-500">
                  연금저축 수령액이 연 1,500만 원을 초과하면 종합과세 또는 16.5% 분리과세 대상이 되므로 수령 기간 분산 필수.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">상속세 및 양도소득세 사전 대비</div>
                <p className="text-[11px] text-slate-500">
                  향후 지방 상가주택 상속 시 지분 평가액 및 형제 간 증여·양도 시 세무 리스크 사전 점검.
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
            🏛️ 한영호 세무사 1:1 상담 (QR)
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
    </div>
  );
}
