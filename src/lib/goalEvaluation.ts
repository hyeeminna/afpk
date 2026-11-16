// AFPK·CFP 6단계 표준 프로세스 기반 재무목표 평가 엔진
export interface EvaluatedGoalItem {
  id: string;
  rank: string;
  name: string;
  period: string;
  neededNum: number;
  needed: string;
  prepNum: number;
  prep: string;
  shortageNum: number;
  shortage: string;
  status: "달성 가능 🟢" | "사전 합의 🟡" | "위험 경보 🔴" | "진단 대기 ⚪";
  statusCode: "green" | "yellow" | "red" | "gray";
  expertOpinion: string;
}

export interface SolutionComparisonItem {
  item: string;
  before: string;
  after: string;
  effect: string;
}

export interface EvaluationResult {
  goals: EvaluatedGoalItem[];
  solutions: SolutionComparisonItem[];
}

export function parseNum(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9.-]/g, "");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

export function formatKoreanAmount(num: number): string {
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
}

export function evaluateFinancialGoals(params: {
  isTemplateBlank: boolean;
  totalAsset: any;
  totalDebt: any;
  monthlyIncome: any;
  monthlyExpense: any;
  emergencyFund?: any;
  goalName?: string;
  goalAmount?: any;
  goalDate?: string;
  aiGoals?: EvaluatedGoalItem[];
  aiSolutions?: SolutionComparisonItem[];
}): EvaluationResult {
  const {
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
  } = params;

  // 1. 동적 수치 산출 (가상 고객 모드인 경우에도 고정값이 아닌 유효 데이터를 기반으로 동적 산출)
  const isDemo = !isTemplateBlank;
  const cleanAsset = parseNum(totalAsset) || (isDemo ? 1721710000 : 0);
  const cleanDebt = parseNum(totalDebt) || (isDemo ? 250000000 : 0);
  const cleanIncome = parseNum(monthlyIncome) || (isDemo ? 8050000 : 0);
  const cleanExpense = parseNum(monthlyExpense) || (isDemo ? 7330000 : 0);
  const cleanEmergency = parseNum(emergencyFund) || (isDemo ? 22000000 : 0);
  const cleanSurplus = cleanIncome - cleanExpense;
  const cleanNetWorth = cleanAsset - cleanDebt;
  const cleanGoalAmount = parseNum(goalAmount) || (isDemo ? 70000000 : 0);

  // 2. Gemini AI 재무주치의 실시간 정밀 진단 결과가 있는 경우 최우선 반영하되, 실시간 사용자 입력값과 100% 동기화
  if (aiGoals && Array.isArray(aiGoals) && aiGoals.length > 0) {
    const synchronizedAiGoals = aiGoals.map((g) => {
      const copy = { ...g };
      if (copy.id === "debt") {
        if (cleanDebt === 0) {
          copy.needed = "0원";
          copy.neededNum = 0;
          copy.shortage = "0원 (해결)";
          copy.shortageNum = 0;
          copy.status = "달성 가능 🟢";
          copy.statusCode = "green";
        } else {
          copy.needed = formatKoreanAmount(cleanDebt);
          copy.neededNum = cleanDebt;
          const prep = Math.min(cleanAsset, cleanDebt);
          const shortage = Math.max(0, cleanDebt - cleanAsset);
          copy.prep = prep > 0 ? `${formatKoreanAmount(prep)}` : "0원";
          copy.prepNum = prep;
          copy.shortage = shortage === 0 ? "0원 (해결)" : `${formatKoreanAmount(shortage)}`;
          copy.shortageNum = shortage;
          copy.status = cleanAsset >= cleanDebt ? "달성 가능 🟢" : (cleanSurplus > 0 ? "사전 합의 🟡" : "위험 경보 🔴");
          copy.statusCode = cleanAsset >= cleanDebt ? "green" : (cleanSurplus > 0 ? "yellow" : "red");
        }
      } else if (copy.id === "custom_goal") {
        if (goalName) copy.name = goalName;
        if (goalDate) copy.period = goalDate;
        if (cleanGoalAmount > 0) {
          copy.needed = formatKoreanAmount(cleanGoalAmount);
          copy.neededNum = cleanGoalAmount;
          const prep = Math.min(cleanGoalAmount, Math.max(0, cleanNetWorth));
          const shortage = Math.max(0, cleanGoalAmount - prep);
          copy.prep = prep > 0 ? formatKoreanAmount(prep) : "0원";
          copy.prepNum = prep;
          copy.shortage = shortage === 0 ? "0원 (달성)" : `${formatKoreanAmount(shortage)}`;
          copy.shortageNum = shortage;
          copy.status = shortage === 0 ? "달성 가능 🟢" : (cleanSurplus > 0 ? "사전 합의 🟡" : "위험 경보 🔴");
          copy.statusCode = shortage === 0 ? "green" : (cleanSurplus > 0 ? "yellow" : "red");
        } else if (isTemplateBlank) {
          copy.needed = "0원 (입력 대기)";
          copy.neededNum = 0;
          copy.prep = "0원";
          copy.prepNum = 0;
          copy.shortage = "0원";
          copy.shortageNum = 0;
          copy.status = "진단 대기 ⚪";
          copy.statusCode = "gray";
        }
      } else if (copy.id === "retirement") {
        const retireNeeded = cleanExpense > 0 ? cleanExpense * 12 * 20 : (cleanIncome > 0 ? Math.round(cleanIncome * 0.7) * 12 * 20 : 0);
        if (retireNeeded > 0) {
          copy.needed = formatKoreanAmount(retireNeeded);
          copy.neededNum = retireNeeded;
          const prep = Math.min(retireNeeded, Math.max(0, Math.round(cleanNetWorth * 0.5)));
          const shortage = Math.max(0, retireNeeded - prep);
          copy.prep = prep > 0 ? formatKoreanAmount(prep) : "0원";
          copy.prepNum = prep;
          copy.shortage = shortage > 0 ? `${formatKoreanAmount(shortage)} ⚠️` : "0원 (해결)";
          copy.shortageNum = shortage;
        } else if (isTemplateBlank) {
          copy.needed = "0원 (입력 대기)";
          copy.neededNum = 0;
          copy.prep = "0원";
          copy.prepNum = 0;
          copy.shortage = "0원";
          copy.shortageNum = 0;
          copy.status = "진단 대기 ⚪";
          copy.statusCode = "gray";
        }
      }
      return copy;
    });

    return {
      goals: synchronizedAiGoals,
      solutions: aiSolutions && aiSolutions.length > 0 ? aiSolutions : [
        {
          item: "아파트 담보대출",
          before: cleanDebt > 0 ? formatKoreanAmount(cleanDebt) : "0원",
          after: "0원 (상환 플랜 수립)",
          effect: cleanDebt > 0 ? "퇴직 직후 원리금 부담 영구 제거, 이자 절감" : "건전한 무부채 구조 유지",
        },
        {
          item: "퇴직 후 월 지출",
          before: cleanExpense > 0 ? `${formatKoreanAmount(cleanExpense)} / 월` : "현재 지출 수준 유지 시 결손",
          after: cleanExpense > 0 ? `${formatKoreanAmount(Math.round(cleanExpense * 0.75))} / 월 (▼ 절감)` : "지출 구조조정 (▼ 절감)",
          effect: "은퇴 소득공백기 적자 최소화",
        },
        {
          item: "은퇴 후 월 수입",
          before: cleanIncome > 0 ? "0원 (근로소득 중단, 소득 절벽)" : "소득 절벽 위험",
          after: cleanExpense > 0 ? `${formatKoreanAmount(cleanExpense)} / 월` : "연금 분할 + 주택연금 결합",
          effect: "부부 종신 안정적 현금흐름 확보",
        },
        {
          item: "금융투자 및 연금 자산",
          before: "일반 과세 계좌 중심",
          after: "중개형 ISA 및 IRP 활용",
          effect: "순이익 비과세 및 저율 분리과세 극대화",
        },
      ],
    };
  }

  // 1) 목표 1: 부채 상환 / 건전성 관리
  let debtItem: EvaluatedGoalItem;
  if (cleanDebt === 0) {
    const isTotallyBlank = cleanAsset === 0 && cleanIncome === 0 && cleanExpense === 0;
    debtItem = {
      id: "debt",
      rank: "-",
      name: isTotallyBlank ? "부채 상환 (직접 설정 대기)" : "부채 상환 (부채 0원)",
      period: isTotallyBlank ? "직접 설정 (입력 대기)" : "달성 완료",
      neededNum: 0,
      needed: "0원",
      prepNum: 0,
      prep: isTotallyBlank ? "0원" : "부채 없음 (건전)",
      shortageNum: 0,
      shortage: isTotallyBlank ? "0원" : "0원 (해결)",
      status: isTotallyBlank ? "진단 대기 ⚪" : "달성 가능 🟢",
      statusCode: isTotallyBlank ? "gray" : "green",
      expertOpinion: isTotallyBlank
        ? "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다."
        : "전문가 평가: 현재 보유한 금융 부채가 없어 매월 고정 원리금 지출이 전혀 발생하지 않으며, 매우 안정적인 부채 건전성을 유지하고 있습니다.",
    };
  } else {
    const isAssetEnough = cleanAsset >= cleanDebt;
    const shortage = isAssetEnough ? 0 : cleanDebt - cleanAsset;
    const canCoverFromSurplus = cleanSurplus > 0 && cleanSurplus * 36 >= cleanDebt;
    const status = isAssetEnough
      ? "달성 가능 🟢"
      : canCoverFromSurplus
      ? "사전 합의 🟡"
      : "위험 경보 🔴";
    const statusCode = isAssetEnough ? "green" : canCoverFromSurplus ? "yellow" : "red";

    debtItem = {
      id: "debt",
      rank: "1순위: 대출 전액 상환",
      name: "대출 전액 상환",
      period: "1년 ~ 3년 내 (은퇴 전 완료 권장)",
      neededNum: cleanDebt,
      needed: formatKoreanAmount(cleanDebt),
      prepNum: Math.min(cleanAsset, cleanDebt),
      prep: isAssetEnough
        ? `보유 자산 (${formatKoreanAmount(cleanAsset)}) 중 상환 가능`
        : `가용 자산 (${formatKoreanAmount(cleanAsset)}) 충당`,
      shortageNum: shortage,
      shortage: shortage === 0 ? "0원 (해결)" : formatKoreanAmount(shortage),
      status,
      statusCode,
      expertOpinion: isAssetEnough
        ? `전문가 평가: 대출금리 부담을 없애기 위해 보유 자산(${formatKoreanAmount(cleanAsset)})을 활용해 은퇴 전 조기 상환할 수 있습니다. 상환 완료 시 매월 고정지출이 대폭 절감됩니다.`
        : `전문가 평가: 총 자산 대비 부채(${formatKoreanAmount(cleanDebt)})가 많아 월 잉여금을 활용한 단계적 분할 상환 계획을 수립해야 합니다.`,
    };
  }

  // 2) 목표 2: 고객 맞춤 핵심 목표
  const effGoalName = goalName || (isDemo ? "장남 결혼자금 지원" : "핵심 재무목표 준비");
  const effGoalAmt = cleanGoalAmount > 0 ? cleanGoalAmount : 0;
  const effGoalPeriod = goalDate || (effGoalAmt > 0 ? (isDemo ? "2년 내" : "2년 ~ 3년 내") : "직접 설정 (입력 대기)");
  const goalPrep = Math.min(effGoalAmt, Math.max(0, cleanNetWorth));
  const goalShortage = Math.max(0, effGoalAmt - goalPrep);
  let goalStatus: "달성 가능 🟢" | "사전 합의 🟡" | "위험 경보 🔴" | "진단 대기 ⚪" = "진단 대기 ⚪";
  let goalStatusCode: "green" | "yellow" | "red" | "gray" = "gray";

  if (effGoalAmt === 0) {
    goalStatus = "진단 대기 ⚪";
    goalStatusCode = "gray";
  } else if (goalShortage === 0) {
    goalStatus = "달성 가능 🟢";
    goalStatusCode = "green";
  } else if (cleanSurplus > 0 && cleanSurplus * 36 >= goalShortage) {
    goalStatus = "달성 가능 🟢";
    goalStatusCode = "green";
  } else if (cleanSurplus > 0) {
    goalStatus = "사전 합의 🟡";
    goalStatusCode = "yellow";
  } else {
    goalStatus = "위험 경보 🔴";
    goalStatusCode = "red";
  }

  const customGoalItem: EvaluatedGoalItem = {
    id: "custom_goal",
    rank: effGoalAmt > 0 ? (cleanDebt > 0 ? "2순위: " + effGoalName : "1순위: " + effGoalName) : "-",
    name: effGoalName,
    period: effGoalPeriod,
    neededNum: effGoalAmt,
    needed: effGoalAmt > 0 ? formatKoreanAmount(effGoalAmt) : "0원",
    prepNum: goalPrep,
    prep: goalPrep > 0 ? formatKoreanAmount(goalPrep) : "0원",
    shortageNum: goalShortage,
    shortage: goalShortage === 0 ? (effGoalAmt > 0 ? "0원 (해결)" : "0원") : formatKoreanAmount(goalShortage),
    status: goalStatus,
    statusCode: goalStatusCode,
    expertOpinion:
      effGoalAmt === 0
        ? "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다."
        : goalShortage === 0
        ? `전문가 평가: 보유 순자산(${formatKoreanAmount(cleanNetWorth)}) 내에서 목표 자금을 안전하게 배분하여 달성할 수 있습니다.`
        : goalShortage > 0 && cleanSurplus > 0
        ? `전문가 평가: 목표 달성을 위해 약 ${formatKoreanAmount(goalShortage)}의 추가 자금이 필요하며, 월 잉여금(${formatKoreanAmount(cleanSurplus)}) 저축과 ISA 비과세 투자가 효과적입니다.`
        : `전문가 평가: 현재 월 잉여금이 부족한 상태이므로 지출 다이어트와 연금 자산 재배치를 통한 재원 마련이 시급합니다.`,
  };

  // 3) 목표 3: 은퇴 생활비 마련 (노후 현금흐름 20년)
  const retireNeeded = cleanExpense > 0
    ? cleanExpense * 12 * 20
    : (cleanIncome > 0 ? Math.round(cleanIncome * 0.7) * 12 * 20 : 0);
  const retirePrep = retireNeeded > 0 ? Math.min(retireNeeded, Math.max(0, Math.round(cleanNetWorth * 0.5))) : 0;
  const retireShortage = Math.max(0, retireNeeded - retirePrep);
  const isRetireRisk = retireNeeded > 0 && (cleanExpense > cleanIncome || cleanNetWorth < retireNeeded);

  const retireItem: EvaluatedGoalItem = {
    id: "retirement",
    rank: retireNeeded > 0
      ? (cleanDebt > 0
          ? (effGoalAmt > 0 ? "3순위: 은퇴 생활비 확보" : "2순위: 은퇴 생활비 확보")
          : (effGoalAmt > 0 ? "2순위: 은퇴 생활비 확보" : "1순위: 은퇴 생활비 확보"))
      : "-",
    name: cleanExpense > 0
      ? `은퇴 생활비 월 ${formatKoreanAmount(cleanExpense)} 확보`
      : "은퇴 생활비 마련 (20년간)",
    period: retireNeeded > 0 ? "은퇴 시점 ~ 20년간" : "직접 설정 (입력 대기)",
    neededNum: retireNeeded,
    needed: retireNeeded > 0 ? formatKoreanAmount(retireNeeded) : "0원",
    prepNum: retirePrep,
    prep: retirePrep > 0 ? formatKoreanAmount(retirePrep) : "0원",
    shortageNum: retireShortage,
    shortage: retireShortage === 0 ? "0원" : formatKoreanAmount(retireShortage) + " ⚠️",
    status: retireNeeded === 0 ? "진단 대기 ⚪" : isRetireRisk ? "위험 경보 🔴" : "달성 가능 🟢",
    statusCode: retireNeeded === 0 ? "gray" : isRetireRisk ? "red" : "green",
    expertOpinion:
      retireNeeded === 0
        ? "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다."
        : cleanExpense > 0
        ? `긴급 진단: 퇴직 직후 근로소득이 중단되면 매월 ${formatKoreanAmount(cleanExpense)}의 생활비 적자가 발생합니다. 20년간 총 ${formatKoreanAmount(retireNeeded)}의 생활비 재원이 소요되므로, IRP 연금 분할 수령과 주택연금 연계 플랜이 필수적입니다.`
        : `전문가 평가: 현 소득(${formatKoreanAmount(cleanIncome)}) 기준 70% 은퇴 생활비 유지 시 20년간 총 ${formatKoreanAmount(retireNeeded)}의 재원이 필요합니다.`,
  };

  // 4) 목표 4: 비상예비자금 및 세무·상속 사전 대비
  const emergencyNeeded = cleanExpense > 0
    ? cleanExpense * 6
    : (cleanIncome > 0 ? cleanIncome * 3 : (cleanEmergency > 0 ? cleanEmergency : 0));
  const isEmergencyOk = emergencyNeeded > 0 && cleanEmergency >= (cleanExpense > 0 ? cleanExpense * 3 : emergencyNeeded * 0.5);
  const emergencyShortage = Math.max(0, emergencyNeeded - cleanEmergency);

  const emergencyItem: EvaluatedGoalItem = {
    id: "emergency",
    rank: emergencyNeeded > 0
      ? (cleanDebt > 0 && effGoalAmt > 0 && retireNeeded > 0
          ? "4순위: 비상금 & 세무·상속"
          : "후순위: 비상금 & 세무·상속")
      : "-",
    name: "비상예비자금 및 세무·상속 대비",
    period: emergencyNeeded > 0 ? "3년 ~ 5년 내" : "직접 설정 (입력 대기)",
    neededNum: emergencyNeeded,
    needed: emergencyNeeded > 0 ? formatKoreanAmount(emergencyNeeded) : "0원",
    prepNum: cleanEmergency,
    prep: cleanEmergency > 0 ? formatKoreanAmount(cleanEmergency) : "0원",
    shortageNum: emergencyShortage,
    shortage: emergencyShortage === 0 ? "0원" : formatKoreanAmount(emergencyShortage),
    status: emergencyNeeded === 0 ? "진단 대기 ⚪" : isEmergencyOk ? "달성 가능 🟢" : "사전 합의 🟡",
    statusCode: emergencyNeeded === 0 ? "gray" : isEmergencyOk ? "green" : "yellow",
    expertOpinion:
      emergencyNeeded === 0
        ? "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다."
        : isEmergencyOk
        ? `전문가 평가: 월 지출 3개월분 이상의 비상예비자금(${formatKoreanAmount(cleanEmergency)})을 확보하여 금융 충격에 안정적으로 대비되어 있습니다.`
        : `전문가 평가: 비상예비자금 확보율이 권장치(월 지출 3~6개월분)에 미달하므로 수시입출금 계좌 비축과 세무사(한OO 세무사) 상담을 통한 사전 증여·상속 전략 수립을 권장합니다.`,
  };

  // 대안 솔루션 실행 전후 비교표
  const solutions: SolutionComparisonItem[] = [
    {
      item: "아파트 담보대출",
      before: cleanDebt > 0 ? formatKoreanAmount(cleanDebt) : "0원 (부채 없음)",
      after: "0원 (전액 상환 완료)",
      effect: cleanDebt > 0 ? "퇴직 직후 원리금 부담 영구 제거, 이자 비용 절감" : "건전한 무부채 구조 유지",
    },
    {
      item: "퇴직 후 월 지출",
      before: cleanExpense > 0 ? `${formatKoreanAmount(cleanExpense)} / 월` : "0원",
      after: cleanExpense > 0 ? `${formatKoreanAmount(Math.round(cleanExpense * 0.75))} / 월 (▼ 절감)` : "-",
      effect: "대출 상환 및 고정지출 구조조정으로 생활비 25% 절감",
    },
    {
      item: "은퇴 후 월 수입",
      before: cleanIncome > 0 ? "0원 (근로소득 중단, 소득 절벽)" : "0원",
      after: cleanExpense > 0 ? `${formatKoreanAmount(cleanExpense)} / 월 (안정적 연금 수령)` : "-",
      effect: "IRP 연금 분할 수령 + 국민연금 + 주택연금 결합으로 평생 현금흐름 확보",
    },
    {
      item: "금융투자 및 연금 자산",
      before: "일반 계좌 위주 (과세)",
      after: "중개형 ISA 및 IRP 계좌로 이전",
      effect: "순이익 비과세 및 저율 분리과세(3.3%~5.5%) 혜택 극대화",
    },
  ];

  return {
    goals: [debtItem, customGoalItem, retireItem, emergencyItem],
    solutions,
  };
}
