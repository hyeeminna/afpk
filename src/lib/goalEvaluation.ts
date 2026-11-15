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
  let res = "";
  if (uk > 0) res += `${uk}억 `;
  if (man > 0) res += `${man.toLocaleString("ko-KR")}만 `;
  if (rest > 0 && uk === 0) res += `${rest.toLocaleString("ko-KR")}`;
  return `${sign}${res.trim()} 원`;
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
  } = params;

  // 1. 가상 고객 모드인 경우 (Supabase 모범안 고정 데이터 반환)
  if (!isTemplateBlank) {
    return {
      goals: [
        {
          id: "debt",
          rank: "1순위: 대출 전액 상환",
          name: "대출 전액 상환",
          period: "1년 내 (퇴직 시점)",
          neededNum: 250000000,
          needed: "2억 5,000만 원",
          prepNum: 250000000,
          prep: "현금 1억 + 퇴직금 1.5억",
          shortageNum: 0,
          shortage: "0원 (해결)",
          status: "달성 가능 🟢",
          statusCode: "green",
          expertOpinion:
            "전문가 평가: 대출금리(4~5%)가 세후 예금수익률(2.4%)보다 높으므로 퇴직 시 즉시 상환이 유리합니다. 상환 완료 시 매월 원리금 185만 원(이자 월 약 104만 원) 부담이 영구적으로 사라집니다.",
        },
        {
          id: "wedding",
          rank: "2순위: 장남 결혼자금 지원",
          name: "장남 결혼자금 지원",
          period: "2년 내",
          neededNum: 70000000,
          needed: "7,000만 원",
          prepNum: 70000000,
          prep: "보유 정기예금 2억 중 활용",
          shortageNum: 0,
          shortage: "0원 (해결)",
          status: "달성 가능 🟢",
          statusCode: "green",
          expertOpinion:
            "전문가 평가: 보유 정기예금 2억 원 중 7,000만 원을 결혼자금 전용 단기 정기예금으로 분리하여 안전하게 지원 가능합니다.",
        },
        {
          id: "retirement",
          rank: "3순위: 은퇴 생활비 월 300만 원 확보",
          name: "은퇴 생활비 월 300만 원 확보",
          period: "61세 ~ 80세 (20년간)",
          neededNum: 688000000,
          needed: "약 6억 8,800만 원",
          prepNum: 370000000,
          prep: "약 3억 7,000만 원",
          shortageNum: 320000000,
          shortage: "약 3억 2,000만 원 ⚠️",
          status: "위험 경보 🔴",
          statusCode: "red",
          expertOpinion:
            "긴급 진단: 대출 상환 및 결혼자금 지출 후 남은 금융자산만으로는 퇴직 후 소득 공백기(61~64세)와 70대 이후 생활비에 3.2억 원 결손이 발생합니다. 따라서 퇴직급여 IRP 연금 분할 수령과 71세 주택연금 연계 대안이 반드시 결합되어야 합니다.",
        },
        {
          id: "inheritance",
          rank: "4순위: 상가주택 상속 대비",
          name: "상가주택 상속 대비",
          period: "4년 내 (예상 시점)",
          neededNum: 77600000,
          needed: "상속세 약 7,760만 원",
          prepNum: 77600000,
          prep: "연부연납 + 임대수입",
          shortageNum: 0,
          shortage: "사전 합의 필요",
          status: "사전 합의 🟡",
          statusCode: "yellow",
          expertOpinion:
            "전문가 평가: 형제 3명과 분할 비율을 사전 합의하여 서면화해야 분쟁을 막을 수 있습니다. 본인 상속세 7,760만 원은 은퇴자금을 헐지 않고, 연부연납(5년 분할납부)과 상가 임대수입으로 충당하는 전략을 권장합니다.",
        },
      ],
      solutions: [
        {
          item: "아파트 담보대출",
          before: "2억 5,000만 원 (연 4%, 월 185만 원)",
          after: "0원 (전액 상환 완료)",
          effect: "퇴직 직후 원리금 부담 영구 제거, 이자 2,100만 원 절감",
        },
        {
          item: "퇴직 후 월 지출",
          before: "637만 원 / 월 (대출 원리금 185만 포함)",
          after: "452만 원 / 월 (▼ 185만 원 감소)",
          effect: "대출 상환으로 고정지출 30% 대폭 절감",
        },
        {
          item: "은퇴 후 월 수입",
          before: "45만 원 (이자·배당만 발생, 소득 절벽)",
          after: "300만 원 / 월 (안정적 연금 수령)",
          effect: "IRP 250만 + 연금저축 50만 원 (64세부터 국민연금 85만 원 합산)",
        },
        {
          item: "주식 · ETF (4,170만 원)",
          before: "일반 증권위탁계좌 (과세)",
          after: "중개형 ISA 계좌로 이전",
          effect: "순이익 200만 원 비과세 및 초과분 9.9% 분리과세 혜택",
        },
        {
          item: "71세 이후 은퇴 생활비",
          before: "금융자산 고갈로 생활비 결손 위험",
          after: "수원 아파트 주택연금 (월 297만 원)",
          effect: "10억 아파트 유동화로 부부 종신까지 월 300만 수준 완벽 유지",
        },
      ],
    };
  }

  // 2. 신규 고객 직접 입력 데이터 모드
  const cleanAsset = parseNum(totalAsset);
  const cleanDebt = parseNum(totalDebt);
  const cleanIncome = parseNum(monthlyIncome);
  const cleanExpense = parseNum(monthlyExpense);
  const cleanSurplus = cleanIncome - cleanExpense;
  const cleanEmergency = parseNum(emergencyFund);
  const cleanNetWorth = cleanAsset - cleanDebt;
  const cleanGoalAmount = parseNum(goalAmount);

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
  const effGoalName = goalName || "핵심 재무목표 준비";
  const effGoalAmt = cleanGoalAmount > 0 ? cleanGoalAmount : 0;
  const effGoalPeriod = goalDate || (effGoalAmt > 0 ? "2년 ~ 3년 내" : "직접 설정 (입력 대기)");
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
