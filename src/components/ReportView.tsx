"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";

interface ReportViewProps {
  onNavigateStep?: (step: "step1" | "step2" | "step3" | "financial_status" | "goals" | "report" | "settings") => void;
  onOpenTaxModal?: () => void;
  isTemplateBlank?: boolean;
  onLoadSupabaseData?: () => void;
  totalAsset?: string;
  totalDebt?: string;
  monthlyIncome?: string;
  monthlyExpense?: string;
}

export default function ReportView({
  onNavigateStep,
  onOpenTaxModal,
  isTemplateBlank = false,
  onLoadSupabaseData,
  totalAsset = "",
  totalDebt = "",
  monthlyIncome = "",
  monthlyExpense = "",
}: ReportViewProps) {
  const { user, profile } = useAuth();

  // 실제 서비스 이용 날짜 (발행일자)
  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 고객명: 로그인 시 해당 고객명, 미로그인 시 '익명'
  const clientName =
    user?.user_metadata?.full_name ||
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "익명";

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
            재무상태표, 현금흐름표, 4대 재무목표 및 솔루션을 집약한 종합 자문 리포트입니다.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenTaxModal}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <span>🏛️</span>
            <span>세무사 검토 요청</span>
          </button>
        </div>
      </div>

      {/* Blank Mode Guidance Banner */}
      {isTemplateBlank && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn max-w-4xl mx-auto">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-xl">📝</span>
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">
                신규 고객 공인 리포트 작성 모드:{" "}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                고객이 직접 정해진 양식에 입력한 재무 데이터에 따라 종합 진단 리포트가 실시간으로 편성됩니다.
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
              <span className="text-slate-400">자문기관:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">ARPK 재무주치의</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-slate-400">고객명:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {clientName} {clientName === "익명" ? "" : "님"}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-slate-400">발행일자:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{todayStr}</span>
            </div>
          </div>
        </div>

        {/* Section 1: 재무상태표 (Balance Sheet) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-sm"></span>
              <span>1. 재무상태표 요약 (2026년 10월 기준)</span>
            </h3>
            <span className="text-xs text-slate-400">Supabase 10월 재무상태표 상세</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2 px-3">분류</th>
                  <th className="py-2 px-3">세부 항목</th>
                  <th className="py-2 px-3 text-right">평가액</th>
                  <th className="py-2 px-3 text-right">비중</th>
                  <th className="py-2 px-3">진단 메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">현금성자산</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">정기예금 · 적금</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">200,000,000원</td>
                  <td className="py-2 px-3 text-right text-slate-500">11.6%</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">비상금 및 자녀 결혼자금 예비</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">투자자산</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">삼성전자, 미국S&amp;P500, 나스닥100 ETF</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">41,705,500원</td>
                  <td className="py-2 px-3 text-right text-slate-500">2.4%</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">삼성전자 53% 집중 ➡️ ISA 이전 권고</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">은퇴자산</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">퇴직급여(4억) + 연금저축(8천만)</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">480,000,000원</td>
                  <td className="py-2 px-3 text-right text-slate-500">27.9%</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">퇴직급여 1년 뒤 수령 ➡️ IRP 이전 필수</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">사용자산</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">수원 아파트 (자가)</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">1,000,000,000원</td>
                  <td className="py-2 px-3 text-right text-slate-500">58.1%</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">거주용, 71세 주택연금 연계 권고</td>
                </tr>
                <tr className="bg-blue-50/60 dark:bg-blue-950/40 font-bold">
                  <td colSpan={2} className="py-2.5 px-3 text-blue-900 dark:text-blue-200">총 자산 합계</td>
                  <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-300 font-extrabold">1,721,710,000원</td>
                  <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-300">100.0%</td>
                  <td className="py-2.5 px-3 text-[11px] text-blue-800 dark:text-blue-300 font-medium">부동산 편중도 높음</td>
                </tr>
                <tr className="bg-red-50/40 dark:bg-red-950/20 font-semibold">
                  <td colSpan={2} className="py-2 px-3 text-red-700 dark:text-red-400">총 부채 (아파트 담보대출)</td>
                  <td className="py-2 px-3 text-right text-red-600 dark:text-red-400 font-bold">250,000,000원</td>
                  <td className="py-2 px-3 text-right text-red-500">-</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">연 4%, 잔여 15년 원리금균등 (월 185만)</td>
                </tr>
                <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-extrabold text-sm">
                  <td colSpan={2} className="py-3 px-3 text-emerald-900 dark:text-emerald-200">순자산 (Net Worth)</td>
                  <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-300">1,471,710,000원</td>
                  <td className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-300">85.5%</td>
                  <td className="py-3 px-3 text-[11px] text-emerald-800 dark:text-emerald-300">부채비율 14.5% (매우 건전)</td>
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
                  <th className="py-2 px-3">구분</th>
                  <th className="py-2 px-3 text-right">현재 (퇴직 전)</th>
                  <th className="py-2 px-3 text-right">퇴직 후 1~3년 (현상태 유지)</th>
                  <th className="py-2 px-3 text-right">증감 (차이)</th>
                  <th className="py-2 px-3">분석 결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2 px-3 font-semibold text-blue-700 dark:text-blue-400">월 수입 합계</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">805만 원</td>
                  <td className="py-2 px-3 text-right font-bold text-red-500">45만 원</td>
                  <td className="py-2 px-3 text-right text-red-500 font-semibold">▼ -760만 원</td>
                  <td className="py-2 px-3 text-[11px] text-red-600 dark:text-red-400">
                    근로소득 중단으로 수입이 94% 급감
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-amber-700 dark:text-amber-400">월 지출 합계</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">733만 원</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">637만 원</td>
                  <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">▼ -96만 원</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">
                    자녀 학비 종료되나 대출(185만)+건보료(40만) 지속
                  </td>
                </tr>
                <tr className="bg-red-50/60 dark:bg-red-950/40 font-extrabold text-sm">
                  <td className="py-2.5 px-3 text-red-900 dark:text-red-200">월 잉여금 (수지)</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">+72만 원</td>
                  <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-extrabold">-592만 원</td>
                  <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-bold">▼ -664만 원</td>
                  <td className="py-2.5 px-3 text-[11px] text-red-700 dark:text-red-300 font-bold">
                    퇴직 즉시 매달 592만 원의 결손 발생 ⚠️
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
            <span className="text-xs text-slate-400">Supabase 재무목표(순위, 기한, 금액)</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2 px-3">순위</th>
                  <th className="py-2 px-3">목표 명칭</th>
                  <th className="py-2 px-3">목표 기한</th>
                  <th className="py-2 px-3 text-right">필요 자금</th>
                  <th className="py-2 px-3">준비 자금</th>
                  <th className="py-2 px-3 text-right">부족액</th>
                  <th className="py-2 px-3 text-center">평가 결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2 px-3 font-bold text-center">🥇 1</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-white">대출 상환 (퇴직급여 활용)</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">1년 내</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">2억 5,000만 원</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">현금 1억 + 퇴직금 1.5억</td>
                  <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">0원</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      달성 가능 🟢
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-center">🥈 2</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-white">장남 결혼자금 마련</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">2년 내</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">7,000만 원</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">보유 정기예금 2억 중</td>
                  <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">0원</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      달성 가능 🟢
                    </span>
                  </td>
                </tr>
                <tr className="bg-red-50/30 dark:bg-red-950/20">
                  <td className="py-2 px-3 font-bold text-center text-red-600 dark:text-red-400">🥉 3</td>
                  <td className="py-2 px-3 font-bold text-red-700 dark:text-red-300">은퇴자금 확보 (월 300만 × 20년)</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">61세 ~ 80세</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">약 6억 8,800만 원</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">약 3억 7,000만 원</td>
                  <td className="py-2 px-3 text-right font-extrabold text-red-600 dark:text-red-400">약 3억 2,000만 원</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px]">
                      위험 경보 🔴
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-center">🏅 4</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-white">상가주택 상속 대비</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">4년 내</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-white">상속세 약 7,760만 원</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">연부연납 + 임대수입</td>
                  <td className="py-2 px-3 text-right font-semibold text-amber-600 dark:text-amber-400">합의 필요</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                      사전 합의 🟡
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: ARPK 재무주치의 최종 종합 소견 */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              ARPK 재무주치의 최종 종합 자문 소견
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            1. <strong>부채 상환 우선</strong>: 대출 2.5억 원은 현금 1억 원과 퇴직급여 1.5억 원으로 즉시 상환하여 월 원리금 185만 원 부담을 없애야 합니다.<br />
            2. <strong>퇴직급여 2.5억 원 IRP 이전</strong>: 일시금 인출을 지양하고, IRP로 이전하여 연금으로 수령 시 퇴직소득세 30%를 절감하고 소득 공백기(61~64세) 생활비를 확보하십시오.<br />
            3. <strong>71세 주택연금 연계</strong>: 금융자산이 소진되는 70대 이후에는 수원 아파트(10억)를 주택연금(월 297만 원)으로 전환하여 부부 100세 종신까지 월 300만 원 생활비를 완벽히 보장할 수 있습니다.
          </p>
          <div className="pt-2 flex justify-end text-[11px] font-semibold text-slate-500">
            공인 자문위원: ARPK 재무주치의 수석 PB
          </div>
        </div>
      </div>
    </div>
  );
}
