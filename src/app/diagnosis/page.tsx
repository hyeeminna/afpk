"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { UserProfilePopover } from "@/components/user-profile-popover";
import FinancialStatusView from "@/components/FinancialStatusView";
import GoalsView from "@/components/GoalsView";
import ReportView from "@/components/ReportView";
import { EvaluatedGoalItem, SolutionComparisonItem } from "@/lib/goalEvaluation";

type StepType =
  | "step1"
  | "step2"
  | "step3"
  | "financial_status"
  | "goals"
  | "report";

interface ChatMessage {
  id: string;
  sender: "user" | "gemini";
  time: string;
  text: string;
  details?: {
    basis?: string[];
    comparison?: {
      plan: string;
      saving: string;
      date: string;
      reduction: string;
    }[];
    summary?: {
      label: string;
      value: string;
      note?: string;
    }[];
    suggestions: string[];
    evaluatedGoals?: EvaluatedGoalItem[];
    solutions?: SolutionComparisonItem[];
  };
}

// 1. 계산기 스타일 숫자 포맷터: 한글, 영문, 특수문자 제거 후 3자리 콤마 (,000 구조)
function formatCalculatorNumber(value: string): string {
  const digitsOnly = value.replace(/[^0-9]/g, "");
  if (!digitsOnly) return "";
  const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
  if (normalized === "") return "0";
  return BigInt(normalized).toLocaleString("ko-KR");
}

// 2. 부호(+/-)를 허용하는 계산기 스타일 포맷터 (자산/부채 변동 입력용)
function formatSignedCalculatorNumber(value: string): string {
  let sign = "";
  if (value.startsWith("-")) sign = "-";
  else if (value.startsWith("+")) sign = "+";
  const digitsOnly = value.replace(/[^0-9]/g, "");
  if (!digitsOnly) return sign;
  const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
  if (normalized === "") return "0";
  return sign + BigInt(normalized).toLocaleString("ko-KR");
}

// 3. 콤마 포함 문자열을 순수 숫자로 파싱 (계산용)
function parseNumber(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/[^0-9.-]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
const parseRawNumber = parseNumber;

// 4. 금액을 한국어 통화 단위(조, 억, 만 원)로 변환
function formatKoreanCurrency(amount: number): string {
  if (isNaN(amount) || amount === 0) return "0원";
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  const jo = Math.floor(abs / 1_000_000_000_000);
  const eok = Math.floor((abs % 1_000_000_000_000) / 100_000_000);
  const man = Math.floor((abs % 100_000_000) / 10_000);
  const remainder = Math.floor(abs % 10_000);

  const parts: string[] = [];
  if (jo > 0) parts.push(`${jo}조`);
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man.toLocaleString("ko-KR")}만`);
  if (remainder > 0) {
    parts.push(`${remainder.toLocaleString("ko-KR")}`);
  }

  const formatted = (parts.join(" ") + "원").trim();
  return isNegative ? `-${formatted}` : formatted;
}

// 4대 고객 유형별 5개 지정 질문 및 AFPK 초기 자문 매핑
export const CONCERN_QUESTIONS_MAP: Record<string, {
  title: string;
  defaultGoal: string;
  defaultAmount: string;
  defaultDate: string;
  questions: string[];
  initialAnswer: (question: string) => {
    text: string;
    summary: { label: string; value: string; note: string }[];
    suggestions: string[];
  };
}> = {
  debt: {
    title: "부채 상환 고객",
    defaultGoal: "은퇴 전 대출 2.5억 전액 상환",
    defaultAmount: "250000000",
    defaultDate: "은퇴 전까지 (3년 내)",
    questions: [
      "은퇴까지 남은 기간 안에 2.5억을 다 갚으려면 매달 얼마씩 상환해야 하나요?",
      "원리금균등, 원금균등, 중도상환 가운데 저한테 가장 유리한 방식은 무엇인가요?",
      "여윳돈이 생기면 대출을 먼저 갚는 게 나을까요, 투자해서 불리는 게 나을까요?",
      "금리가 오르거나 내리면 상환 계획이 어떻게 달라지나요?",
      "대출을 갚느라 노후자금(연금, 저축)이 부족해지지는 않을까요?",
    ],
    initialAnswer: (q) => ({
      text: `은퇴 전 부채 상환은 안정적인 노후 현금흐름 확보의 핵심 과제입니다. 질의하신 내용("${q}")을 종합 진단한 결과, 은퇴 후 근로소득 중단 시 고정 원리금 지출은 가계 현금흐름에 치명적 위험이 됩니다. 따라서 보유 가용자산 우선 상환과 퇴직금·월 잉여금을 결합한 단계적 조기 상환 플랜을 권장합니다. 🎯`,
      summary: [
        { label: "총 부채 규모", value: "2억 5,000만 원 (입력값)", note: "아파트 담보대출 기준" },
        { label: "권장 상환 전략", value: "은퇴 전 전액 상환 (계산값)", note: "퇴직 직후 고정비용 영구 제거" },
        { label: "월 이자 절감 효과", value: "월 약 83만 ~ 104만 원 [가정]", note: "대출금리 연 4~5% 가정 시" },
      ],
      suggestions: [
        "원리금 상환 방식 최적화: 퇴직 전까지 원금균등 분할상환으로 총이자 부담을 최소화하세요.",
        "여윳돈 배분 우선순위: 대출금리(4%)가 세후 안전자산 수익률보다 높으므로 중도상환수수료 면제 시점마다 원금 우선 상환을 권장합니다.",
        "노후 연금 최소 납입 유지: 세액공제 혜택이 큰 IRP/연금저축(월 30~40만 원)은 유지하면서 나머지 잉여금을 대출 상환에 집중하세요.",
      ],
    }),
  },
  wedding: {
    title: "목돈 마련 고객",
    defaultGoal: "장남 결혼자금 7,000만 원 지원",
    defaultAmount: "70000000",
    defaultDate: "2년 내",
    questions: [
      "결혼 시점까지 7,000만 원(금액은 변동 가능)을 모으려면 매달 얼마를 저축하거나 투자해야 하나요?",
      "자녀에게 7,000(금액은 변동 가능)만 원을 주면 증여세가 얼마나 나오나요? 결혼자금 증여공제를 받을 수 있나요?",
      "한 번에 주는 것과 나눠서 주는 것 중 세금 면에서 어느 쪽이 유리한가요?",
      "결혼자금을 지원하면 제 은퇴자금에 얼마나 영향이 있나요?",
      "남은 기간을 생각하면 어떤 금융상품(예적금, ISA, 펀드 등)으로 준비하는 게 좋을까요?",
    ],
    initialAnswer: (q) => ({
      text: `자녀 결혼자금 지원 질의("${q}")에 대한 AFPK 표준 진단입니다. 현행 세법상 '혼인 증여재산 공제'(최대 1억 원 추가 공제)를 활용하면 7,000만 원 전액을 증여세 없이 합법적으로 지원할 수 있습니다. 단기(2년 내) 목적 자금이므로 원금 손실 위험이 없는 안전자산 포트폴리오로 준비하시길 권장합니다. 🎯`,
      summary: [
        { label: "목표 지원 자금", value: "7,000만 원 (입력값)", note: "장남 결혼자금 지원 목표" },
        { label: "혼인 증여세 공제", value: "최대 1억 5천만 원 공제 (계산값)", note: "기본공제 5천만 + 혼인공제 1억" },
        { label: "예상 증여세액", value: "0원 (전액 비과세) [가정]", note: "혼인 전후 2년 내 증여 시" },
      ],
      suggestions: [
        "혼인 증여공제 요건 확인: 혼인신고일 전후 2년 이내(총 4년) 증여 시 직계존속 1억 원 추가 공제가 적용되므로 세무 신고를 정확히 진행하세요.",
        "단기 자금 포트폴리오 구축: 결혼 시점(2년 내)을 감안하여 변동성 높은 주식형 상품보다는 1~2년 만기 확정금리 상품(연 3.5~4.0%)에 배치하세요.",
        "은퇴자금 안전선 확보: 본인의 20년 은퇴 생활비 재원을 침해하지 않도록 현재 보유 유동성 자산 한도 내에서 지원을 확정하세요.",
      ],
    }),
  },
  living: {
    title: "은퇴 생활비 고객",
    defaultGoal: "은퇴 후 생활비 월 300만 원 확보",
    defaultAmount: "720000000",
    defaultDate: "60세 은퇴 시점",
    questions: [
      "국민연금과 퇴직연금을 합치면 매달 얼마나 받을 수 있고, 300만 원(금액은 변동 가능)까지 얼마나 모자라나요?",
      "물가상승을 반영하면 지금의 월 300만 원(금액은 변동 가능)은 은퇴 시점에 얼마가 되나요?",
      "100세까지 산다고 가정하면 은퇴 시점에 총 얼마가 있어야 하나요?",
      "연금저축, IRP, 즉시연금 가운데 평생 소득을 만들려면 무엇을 어떻게 조합해야 하나요?",
      "국민연금을 앞당겨 받는 것과 늦춰 받는 것 중 저한테 어떤 게 유리한가요?",
    ],
    initialAnswer: (q) => ({
      text: `은퇴 생활비 확보 질의("${q}")에 대한 AFPK 은퇴설계 진단입니다. 은퇴 후 월 300만 원의 평생 현금흐름을 확보하려면 국민연금, 퇴직연금·IRP, 주택연금의 '3층 연금 피라미드' 결합이 필수적입니다. 특히 60세 퇴직 후 국민연금 개시(65세)까지의 '5년 소득 공백기'를 메우는 브릿지 연금 플랜이 최우선 과제입니다. 🎯`,
      summary: [
        { label: "희망 월 생활비", value: "월 300만 원 (입력값)", note: "부부 기준 월 적정 생활비" },
        { label: "20년간 총 필요 자금", value: "약 7억 2,000만 원 (계산값)", note: "물가상승 및 은퇴 20년 기준" },
        { label: "연금 소득 목표", value: "월 약 280만 ~ 320만 원 [가정]", note: "국민연금+IRP+주택연금 결합 시" },
      ],
      suggestions: [
        "5년 소득 공백기 대비: 60세부터 65세까지는 개인형 IRP 및 연금저축을 집중 분할 수령하여 공백기 생활비를 확보하세요.",
        "국민연금 수령 시기 조율: 건강 상태와 소득 공백 여부에 따라 조기노령연금(연 6% 감액)보다는 정규 시점 수령 또는 1~2년 연기(연 7.2% 증액)를 검토하세요.",
        "주택연금 종신 안전망: 자가 주택을 활용한 주택연금 가입 시 부부 평생 비과세 월 수령액을 확보할 수 있습니다.",
      ],
    }),
  },
  inheritance: {
    title: "상가주택 상속 대비 절세 고객",
    defaultGoal: "상가주택 상속 및 절세 대비",
    defaultAmount: "77600000",
    defaultDate: "향후 3년 ~ 5년 내",
    questions: [
      "지금 상가주택을 상속하면 상속세가 대략 얼마나 나오나요?",
      "미리 증여하는 것과 상속하는 것 중 세금 면에서 어느 쪽이 유리한가요?",
      "상가주택은 시가와 기준시가 가운데 어느 금액으로 평가되나요? 감정평가를 받는 게 유리한가요?",
      "자녀 여러 명에게 어떻게 나눠야 세금도 줄이고 분쟁도 막을 수 있나요?",
      "상속세 낼 현금이 부족하면 어떻게 준비해야 하나요? (종신보험, 연부연납, 물납 등)",
    ],
    initialAnswer: (q) => ({
      text: `상가주택 상속·절세 질의("${q}")에 대한 전문 자문 소견입니다. 상가주택은 주거와 상가 면적 비율, 기준시가 및 감정평가 적용 여부에 따라 상속·증여세액 편차가 매우 큽니다. 특히 상속 발생 시 일시 현금 납부 재원이 부족하면 자산 급매나 가산세 위험이 있으므로, 종신보험 보장자산 마련 및 연부연납 제도를 사전 대비하셔야 합니다. 🎯`,
      summary: [
        { label: "상속 대상 자산", value: "상가주택 지분 (입력값)", note: "부동산 및 임대보증금 포함" },
        { label: "상속세 평가 기준", value: "감정평가 vs 기준시가 (계산값)", note: "시가 인정 범위 정밀 검토" },
        { label: "납부 재원 대책", value: "연부연납·종신보험 검토 [가정]", note: "현금 결손 위험 대비" },
      ],
      suggestions: [
        "사전 증여 vs 상속 시뮬레이션: 10년 주기 증여재산공제(성년 자녀 5천만 원)를 활용해 지분을 미리 분산하는 것이 상속세율(최고 50%)을 낮추는 데 유리합니다.",
        "상속세 현금 납부 재원 확보: 피상속인을 피보험자로 하는 종신보험에 가입하면 사망보험금으로 상속세를 즉시 납부할 수 있습니다.",
        "전담 세무사 1:1 상담: 상가주택의 양도소득세·상속세는 복잡한 복합과세 대상이므로 전담 세무사(한OO 세무사)와의 정밀 상담을 반드시 병행하세요.",
      ],
    }),
  },
};

export function detectConcernKey(concernStr: string, gName: string): "debt" | "wedding" | "living" | "inheritance" {
  const combined = ((concernStr || "") + " " + (gName || "")).toLowerCase();
  if (combined.includes("부채") || combined.includes("대출") || combined.includes("상환") || combined.includes("debt")) {
    return "debt";
  }
  if (combined.includes("결혼") || combined.includes("목돈") || combined.includes("자녀") || combined.includes("wedding")) {
    return "wedding";
  }
  if (combined.includes("상속") || combined.includes("증여") || combined.includes("상가") || combined.includes("절세") || combined.includes("inheritance")) {
    return "inheritance";
  }
  return "living";
}

export function createInitialMessages(
  concernKey: "debt" | "wedding" | "living" | "inheritance",
  preferredIdx?: number
): ChatMessage[] {
  const config = CONCERN_QUESTIONS_MAP[concernKey] || CONCERN_QUESTIONS_MAP.living;
  const idx = typeof preferredIdx === "number" && preferredIdx >= 0
    ? preferredIdx % config.questions.length
    : 0;
  const selectedQuestion = config.questions[idx];
  const answer = config.initialAnswer(selectedQuestion);

  return [
    {
      id: "init-user-1",
      sender: "user",
      time: "오후 2:14",
      text: selectedQuestion,
    },
    {
      id: "init-gemini-2",
      sender: "gemini",
      time: "오후 2:14",
      text: answer.text,
      details: {
        summary: answer.summary,
        suggestions: answer.suggestions,
      },
    },
  ];
}

export default function DiagnosisPage() {
  const router = useRouter();
  const { user, profile, signInWithGoogle, isLoading: isAuthLoading } = useAuth();

  // 비로그인 사용자 진단 페이지 직접 접근 차단
  useEffect(() => {
    if (!isAuthLoading && !user) {
      alert("진단 페이지는 로그인 후 이용하실 수 있습니다.\nGoogle 계정 로그인 화면으로 이동합니다.");
      router.replace("/#login");
    }
  }, [user, isAuthLoading, router]);

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

  // 세무사 상담 모달 상태 (한OO 세무사 카카오톡 QR)
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [copiedKakaoId, setCopiedKakaoId] = useState(false);

  const handleCopyKakaoId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("hyh1908");
      setCopiedKakaoId(true);
      setTimeout(() => setCopiedKakaoId(false), 2000);
    }
  };

  // Step 2 Monthly Data (Supabase Table 17766 [10월 현금흐름표 상세] & Table 17948 [9월 현금흐름표 가상])
  const MONTHLY_FINANCE_DATA = {
    "2026-10": {
      label: "2026년 10월",
      shortLabel: "10월 (최신)",
      income: "8,050,000",
      incomeSub: "급여 760만, 이자 40만, 배당 5만",
      fixedExpense: "2,850,000",
      fixedSub: "대출원리금 185만, 보험 50만, 관리비 35만, 통신 15만",
      variableExpense: "4,150,000",
      variableSub: "식비 140만, 의료 60만, 골프·여행 70만, 경조 25만, 자녀 120만",
      investment: "330,000",
      investmentSub: "연금저축·개인형IRP 33만",
      assetChange: "0",
      assetSub: "별도 매입/매도 없음",
      debtChange: "-1,016,667",
      debtSub: "아파트 담보대출 원금 분할상환",
      totalExpense: "7,330,000",
      surplus: "720,000",
      netWorth: "14억 7,171만",
      savingsRate: "8.9%",
    },
    "2026-09": {
      label: "2026년 9월",
      shortLabel: "9월",
      income: "8,040,000",
      incomeSub: "급여 760만, 이자 40만, 배당 4만",
      fixedExpense: "2,820,000",
      fixedSub: "대출원리금 185만, 보험 50만, 관리비 32만, 통신 15만",
      variableExpense: "3,850,000",
      variableSub: "식비 135만, 의료 55만, 골프·여행 55만, 경조 20만, 자녀 120만",
      investment: "330,000",
      investmentSub: "연금저축·개인형IRP 33만",
      assetChange: "0",
      assetSub: "별도 매입/매도 없음",
      debtChange: "-1,016,667",
      debtSub: "아파트 담보대출 원금 분할상환",
      totalExpense: "7,000,000",
      surplus: "1,040,000",
      netWorth: "14억 7,069만",
      savingsRate: "12.9%",
    },
  };

  const [selectedMonth, setSelectedMonth] = useState<"2026-09" | "2026-10">("2026-10");

  // 공란 양식 모드 여부 (true: 신규 고객 작성용 공란, false: Supabase 가상 고객 데이터 모드)
  const [isTemplateBlank, setIsTemplateBlank] = useState(false);

  // 대회 가상 고객 모범 데이터 (Supabase 저장 데이터 원본)
  const DEFAULT_SUPABASE_DATA = {
    totalAsset: "1,721,710,000",
    totalDebt: "250,000,000",
    monthlyIncome: "8,050,000",
    monthlyExpense: "7,330,000",
    emergencyFund: "22,000,000",
    goalName: "은퇴 후 생활비 마련",
    goalAmount: "688,000,000",
    goalDate: "60세 은퇴 시점",
    userConcern: "은퇴 후 월 생활비 300만원 마련",
    monthlyRecords: {
      "2026-10": {
        income: "8,050,000",
        fixedExpense: "2,850,000",
        variableExpense: "4,150,000",
        investment: "330,000",
        assetChange: "0",
        debtChange: "-1,016,667",
      },
      "2026-09": {
        income: "8,040,000",
        fixedExpense: "2,820,000",
        variableExpense: "3,850,000",
        investment: "330,000",
        assetChange: "0",
        debtChange: "-1,016,667",
      },
    },
  };

  // 로컬 스토리지 키 및 저장 함수
  const STORAGE_KEY = "afpk_custom_client_data_v2";
  const USER_PERSISTENT_KEY = "afpk_user_typed_data_persistent_v3";

  // 사용자가 직접 입력한 재무 데이터 실시간 자동 저장
  const saveUserCustomData = (field: string, value: any) => {
    try {
      const existing = localStorage.getItem(USER_PERSISTENT_KEY);
      const data = existing ? JSON.parse(existing) : {
        totalAsset,
        totalDebt,
        monthlyIncome,
        monthlyExpense,
        emergencyFund,
        goalName,
        goalAmount,
        goalDate,
        monthlyRecords,
      };
      data[field] = value;
      data.hasUserData = true;
      localStorage.setItem(USER_PERSISTENT_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save user custom data", e);
    }
  };

  const saveCurrentDataToStorage = (overrides?: any) => {
    try {
      const payload = {
        isTemplateBlank,
        totalAsset,
        totalDebt,
        monthlyIncome,
        monthlyExpense,
        emergencyFund,
        goalName,
        goalAmount,
        goalDate,
        userConcern,
        monthlyRecords,
        ...overrides,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  };

  // 내가 직접 작성했던 재무 데이터 즉시 불러오기 (언제든 복원)
  const handleRestoreUserCustomData = () => {
    try {
      const userSaved = localStorage.getItem(USER_PERSISTENT_KEY);
      if (userSaved) {
        const data = JSON.parse(userSaved);
        if (data.totalAsset !== undefined) setTotalAsset(data.totalAsset);
        if (data.totalDebt !== undefined) setTotalDebt(data.totalDebt);
        if (data.monthlyIncome !== undefined) setMonthlyIncome(data.monthlyIncome);
        if (data.monthlyExpense !== undefined) setMonthlyExpense(data.monthlyExpense);
        if (data.emergencyFund !== undefined) setEmergencyFund(data.emergencyFund);
        if (data.goalName !== undefined) setGoalName(data.goalName);
        if (data.goalAmount !== undefined) setGoalAmount(data.goalAmount);
        if (data.goalDate !== undefined) setGoalDate(data.goalDate);
        if (data.monthlyRecords !== undefined) setMonthlyRecords(data.monthlyRecords);
        setIsTemplateBlank(true);
        saveCurrentDataToStorage({
          isTemplateBlank: true,
          ...data,
        });
        alert("고객님께서 직접 입력하셨던 재무 데이터로 성공적으로 복원되었습니다.");
        return;
      }
    } catch (e) {
      console.error("Failed to restore user custom data", e);
    }
    alert("이전에 직접 작성하여 저장된 재무 데이터가 없습니다. 현재 양식에 숫자를 입력하시면 실시간으로 안전하게 자동 보존됩니다.");
  };

  // 컴포넌트 마운트 시 저장된 데이터 복원 (초기 1회)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.isTemplateBlank === "boolean") setIsTemplateBlank(data.isTemplateBlank);
        if (data.totalAsset !== undefined) setTotalAsset(data.totalAsset);
        if (data.totalDebt !== undefined) setTotalDebt(data.totalDebt);
        if (data.monthlyIncome !== undefined) setMonthlyIncome(data.monthlyIncome);
        if (data.monthlyExpense !== undefined) setMonthlyExpense(data.monthlyExpense);
        if (data.emergencyFund !== undefined) setEmergencyFund(data.emergencyFund);
        if (data.goalName !== undefined) setGoalName(data.goalName);
        if (data.goalAmount !== undefined) setGoalAmount(data.goalAmount);
        if (data.goalDate !== undefined) setGoalDate(data.goalDate);
        if (data.userConcern !== undefined) setUserConcern(data.userConcern);
        if (data.monthlyRecords !== undefined) setMonthlyRecords(data.monthlyRecords);
      }
    } catch (e) {
      console.error("Failed to load saved data from localStorage", e);
    }
  }, []);

  // 1. Supabase 데이터 불러오기 (지금의 완성 화면 복원)
  const handleLoadSupabaseData = () => {
    setTotalAsset(DEFAULT_SUPABASE_DATA.totalAsset);
    setTotalDebt(DEFAULT_SUPABASE_DATA.totalDebt);
    setMonthlyIncome(DEFAULT_SUPABASE_DATA.monthlyIncome);
    setMonthlyExpense(DEFAULT_SUPABASE_DATA.monthlyExpense);
    setEmergencyFund(DEFAULT_SUPABASE_DATA.emergencyFund);
    setGoalName(DEFAULT_SUPABASE_DATA.goalName);
    setGoalAmount(DEFAULT_SUPABASE_DATA.goalAmount);
    setGoalDate(DEFAULT_SUPABASE_DATA.goalDate);
    setUserConcern(DEFAULT_SUPABASE_DATA.userConcern);
    setMonthlyRecords(DEFAULT_SUPABASE_DATA.monthlyRecords);
    setIsTemplateBlank(false);
    saveCurrentDataToStorage({
      isTemplateBlank: false,
      ...DEFAULT_SUPABASE_DATA,
    });
  };

  // 2. 모든 항목 공란으로 초기화 (위 사진의 버튼 클릭 시 실행: 신규 고객 작성용)
  const handleResetToBlank = () => {
    const blankRecords = {
      "2026-10": {
        income: "",
        fixedExpense: "",
        variableExpense: "",
        investment: "",
        assetChange: "",
        debtChange: "",
      },
      "2026-09": {
        income: "",
        fixedExpense: "",
        variableExpense: "",
        investment: "",
        assetChange: "",
        debtChange: "",
      },
    };
    setTotalAsset("");
    setTotalDebt("");
    setMonthlyIncome("");
    setMonthlyExpense("");
    setEmergencyFund("");
    setGoalName("");
    setGoalAmount("");
    setGoalDate("");
    setUserConcern("");
    setMonthlyRecords(blankRecords);
    setIsTemplateBlank(true);
    saveCurrentDataToStorage({
      isTemplateBlank: true,
      totalAsset: "",
      totalDebt: "",
      monthlyIncome: "",
      monthlyExpense: "",
      emergencyFund: "",
      goalName: "",
      goalAmount: "",
      goalDate: "",
      userConcern: "",
      monthlyRecords: blankRecords,
    });
  };

  const [monthlyRecords, setMonthlyRecords] = useState({
    "2026-10": {
      income: "8,050,000",
      fixedExpense: "2,850,000",
      variableExpense: "4,150,000",
      investment: "330,000",
      assetChange: "0",
      debtChange: "-1,016,667",
    },
    "2026-09": {
      income: "8,040,000",
      fixedExpense: "2,820,000",
      variableExpense: "3,850,000",
      investment: "330,000",
      assetChange: "0",
      debtChange: "-1,016,667",
    },
  });

  const updateCurrentMonthRecord = (
    field: "income" | "fixedExpense" | "variableExpense" | "investment" | "assetChange" | "debtChange",
    value: string
  ) => {
    setMonthlyRecords((prev) => {
      const nextRecords = {
        ...prev,
        [selectedMonth]: {
          ...prev[selectedMonth],
          [field]: value,
        },
      };
      saveUserCustomData("monthlyRecords", nextRecords);
      return nextRecords;
    });
  };

  const handleSelectMonth = (month: "2026-09" | "2026-10") => {
    setSelectedMonth(month);
  };

  // 실시간 계산용 수치 (Step 1)
  const parsedAsset = parseNumber(totalAsset);
  const parsedDebt = parseNumber(totalDebt);
  const calcNetWorth = parsedAsset - parsedDebt;

  const parsedIncome = parseNumber(monthlyIncome);
  const parsedExpense = parseNumber(monthlyExpense);
  const calcSurplus = parsedIncome - parsedExpense;
  const calcSavingsRate =
    parsedIncome > 0 ? ((calcSurplus / parsedIncome) * 100).toFixed(1) : "0.0";

  const parsedEmergency = parseNumber(emergencyFund);
  const calcEmergencyMonths =
    parsedExpense > 0 ? (parsedEmergency / parsedExpense).toFixed(1) : "0.0";

  // 실시간 계산용 수치 (Step 2: 9월 및 10월 독립 연산)
  const rec9 = monthlyRecords["2026-09"];
  const m9Income = parseNumber(rec9.income);
  const m9Fixed = parseNumber(rec9.fixedExpense);
  const m9Variable = parseNumber(rec9.variableExpense);
  const m9Invest = parseNumber(rec9.investment);
  const m9TotalExpense = m9Fixed + m9Variable + m9Invest;
  const m9Surplus = m9Income - m9TotalExpense;
  const m9DebtNum = parseNumber(rec9.debtChange);
  const m9AssetNum = parseNumber(rec9.assetChange);
  // 순자산: 14억 7,069만 특정값 배제, 실시간 자산·부채 계산식 적용
  const baseNetWorth = isTemplateBlank
    ? (calcNetWorth !== 0 ? calcNetWorth : 0)
    : (calcNetWorth || 1471710000);
  const m9NetWorth = baseNetWorth;

  const rec10 = monthlyRecords["2026-10"];
  const m10Income = parseNumber(rec10.income);
  const m10Fixed = parseNumber(rec10.fixedExpense);
  const m10Variable = parseNumber(rec10.variableExpense);
  const m10Invest = parseNumber(rec10.investment);
  const m10TotalExpense = m10Fixed + m10Variable + m10Invest;
  const m10Surplus = m10Income - m10TotalExpense;
  const m10DebtNum = parseNumber(rec10.debtChange);
  const m10AssetNum = parseNumber(rec10.assetChange);
  const m10NetWorth = isTemplateBlank
    ? baseNetWorth
    : baseNetWorth + Math.abs(m10DebtNum) + m10AssetNum;

  // 현재 선택된 월의 요약 수치
  const currentRec = monthlyRecords[selectedMonth];
  const currentMonthIncome = parseNumber(currentRec.income);
  const currentMonthFixed = parseNumber(currentRec.fixedExpense);
  const currentMonthVariable = parseNumber(currentRec.variableExpense);
  const currentMonthInvest = parseNumber(currentRec.investment);
  const currentMonthTotalExpense = currentMonthFixed + currentMonthVariable + currentMonthInvest;
  const currentMonthSurplus = currentMonthIncome - currentMonthTotalExpense;
  const currentMonthNetWorth = selectedMonth === "2026-10" ? m10NetWorth : m9NetWorth;

  // Retrieve user inputs from homepage (without URL query string)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedIncome = sessionStorage.getItem("financialDoctor_income");
        if (savedIncome !== null && savedIncome !== "" && savedIncome !== "3,000,000") {
          setMonthlyIncome(savedIncome);
        }
        const savedConcern = sessionStorage.getItem("financialDoctor_concern");
        const savedGoal = sessionStorage.getItem("financialDoctor_goalName");
        if (savedGoal) {
          setGoalName(savedGoal);
        }
        const randIdx = Math.floor((Date.now() / 1000) % 5);
        if (savedConcern) {
          setUserConcern(savedConcern);
          const detectedKey = detectConcernKey(savedConcern, savedGoal || "");
          setMessages(createInitialMessages(detectedKey, randIdx));

          if (!savedGoal) {
            if (savedConcern.includes("대출") || savedConcern.includes("부채")) {
              setGoalName("은퇴 전 대출 2.5억 전액 상환");
            } else if (savedConcern.includes("결혼") || savedConcern.includes("자녀")) {
              setGoalName("장남 결혼자금 7,000만 원 지원");
            } else if (savedConcern.includes("생활비")) {
              setGoalName("은퇴 후 생활비 월 300만 원 확보");
            } else if (savedConcern.includes("상속") || savedConcern.includes("절세")) {
              setGoalName("상가주택 상속 및 절세 대비");
            } else if (savedConcern.includes("연금")) {
              setGoalName("국민·퇴직연금 수령 준비");
            } else if (savedConcern.includes("자산")) {
              setGoalName("은퇴 자산 안정적 운용");
            }
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

  // Gemini Pro AI 재무주치의 실시간 목표 평가 상태
  const [aiEvaluatedGoals, setAiEvaluatedGoals] = useState<EvaluatedGoalItem[] | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("afpk_ai_evaluated_goals_v1");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [aiEvaluatedSolutions, setAiEvaluatedSolutions] = useState<SolutionComparisonItem[] | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("afpk_ai_evaluated_solutions_v1");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [evaluatedModelName, setEvaluatedModelName] = useState<string>("gemini-flash-latest");

  // Gemini 실제 활성 모델 기반 재무목표 정밀 진단 수동/자동 트리거
  const handleTriggerAiGoalEvaluation = async () => {
    setIsAiEvaluating(true);
    try {
      const dataMode = isTemplateBlank ? "custom" : "demo";
      const financialContext = {
        dataMode,
        totalAsset: totalAsset || (dataMode === "demo" ? "17억 2,171만 원" : "0원"),
        totalDebt: totalDebt || (dataMode === "demo" ? "2억 5,000만 원" : "0원"),
        netWorth: formatKoreanCurrency(calcNetWorth || 1471710000),
        monthlyIncome: monthlyIncome || (dataMode === "demo" ? "805만 원" : "0원"),
        monthlyExpense: monthlyExpense || (dataMode === "demo" ? "733만 원" : "0원"),
        monthlySurplus: `${calcSurplus.toLocaleString()}원`,
        emergencyFund: emergencyFund || (dataMode === "demo" ? "2,200만 원" : "0원"),
        goalName: goalName || (dataMode === "demo" ? "장남 결혼자금 지원" : "은퇴 재무목표"),
        goalAmount: goalAmount ? `${goalAmount}원` : (dataMode === "demo" ? "7,000만 원" : "0원"),
        goalDate: goalDate || (dataMode === "demo" ? "2년 내" : "시점 미정"),
      };

      const res = await fetch("/api/evaluate-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataMode,
          financialContext,
          chatHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!res.ok) throw new Error("AI 목표 정밀 진단에 실패했습니다.");
      const data = await res.json();
      if (data.usedModel) {
        setEvaluatedModelName(data.usedModel);
      }
      if (data.goals && Array.isArray(data.goals)) {
        setAiEvaluatedGoals(data.goals);
        try {
          localStorage.setItem("afpk_ai_evaluated_goals_v1", JSON.stringify(data.goals));
        } catch (e) {}
      }
      if (data.solutions && Array.isArray(data.solutions)) {
        setAiEvaluatedSolutions(data.solutions);
        try {
          localStorage.setItem("afpk_ai_evaluated_solutions_v1", JSON.stringify(data.solutions));
        } catch (e) {}
      }
    } catch (err) {
      console.error("AI Goal Evaluation Error:", err);
    } finally {
      setIsAiEvaluating(false);
    }
  };
  // 4대 고객 유형 중 활성 고민 감지
  const activeConcernKey = detectConcernKey(userConcern, goalName);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return createInitialMessages("living");
  });

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
      const dataMode = isTemplateBlank ? "custom" : "demo";
      const cleanRetireExpense = parsedExpense > 0 ? parsedExpense : (isTemplateBlank ? 0 : 6370000);
      const cleanRetireIncome = isTemplateBlank ? 0 : 450000;
      const calcRetireDeficit = cleanRetireExpense - cleanRetireIncome;

      const financialContext = {
        dataMode,
        goal: goalName || (isTemplateBlank ? "은퇴 재무목표" : "은퇴 후 월 생활비 300만원 마련"),
        goalAmount: goalAmount ? `${goalAmount}원` : (isTemplateBlank ? "0원" : "6억 8,800만 원"),
        goalDate: goalDate || (isTemplateBlank ? "시점 미정" : "60세 은퇴 시점"),
        totalAsset: totalAsset ? `${totalAsset}원` : "0원",
        totalDebt: totalDebt ? `${totalDebt}원` : "0원",
        netWorth: `${calcNetWorth.toLocaleString()}원`,
        monthlyIncome: monthlyIncome ? `${monthlyIncome}원` : "0원",
        monthlyExpense: monthlyExpense ? `${monthlyExpense}원` : "0원",
        monthlySurplus: `${calcSurplus.toLocaleString()}원`,
        emergencyFund: emergencyFund ? `${emergencyFund}원` : "0원",
        emergencyMonths: parsedExpense > 0 ? (parsedEmergency / parsedExpense).toFixed(1) : "0",
        retirementDeficit: calcRetireDeficit > 0 ? `-${formatKoreanCurrency(calcRetireDeficit)}` : "0원",
        monthlyRecords: {
          "10월": {
            income: `${rec10.income}원`,
            fixedExpense: `${rec10.fixedExpense}원`,
            variableExpense: `${rec10.variableExpense}원`,
            investment: `${rec10.investment}원`,
            debtChange: `${rec10.debtChange}원`,
          },
          "9월": {
            income: `${rec9.income}원`,
            fixedExpense: `${rec9.fixedExpense}원`,
            variableExpense: `${rec9.variableExpense}원`,
            investment: `${rec9.investment}원`,
            debtChange: `${rec9.debtChange}원`,
          },
        },
        concern: userConcern || `${goalName || "재무목표"} 달성 및 현금흐름 최적화`,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          dataMode,
          financialContext,
          userContext: financialContext,
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

      // Gemini Pro가 상담 결과에 따라 재무목표를 동적으로 재산출한 경우 자동 반영
      if (data.details?.evaluatedGoals && Array.isArray(data.details.evaluatedGoals)) {
        setAiEvaluatedGoals(data.details.evaluatedGoals);
        try {
          localStorage.setItem("afpk_ai_evaluated_goals_v1", JSON.stringify(data.details.evaluatedGoals));
        } catch (e) {}
      }
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

  if (!isAuthLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070D1E] p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">로그인이 필요합니다</h2>
          <p className="text-sm text-slate-500">진단 페이지는 로그인 후 안전하게 재무계획을 저장하고 관리하실 수 있습니다.</p>
          <button
            type="button"
            onClick={() => router.replace("/#login")}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all cursor-pointer"
          >
            로그인 화면으로 이동하기
          </button>
        </div>
      </div>
    );
  }

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
              onClick={() => setCurrentStep("financial_status")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                currentStep === "financial_status"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                query_stats
              </span>
              <span>내 재무현황</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep("report")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === "report"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                description
              </span>
              <span>리포트</span>
            </button>
          </nav>
        </div>

        {/* 세무사 상담 Card at bottom of sidebar */}
        <div
          onClick={() => setShowTaxModal(true)}
          className="rounded-xl bg-[#131F37] border border-slate-700/80 p-3.5 cursor-pointer hover:bg-[#182744] hover:border-slate-600 transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400 text-base">✦</span>
            <span className="text-xs font-bold text-white">세무사 상담</span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium leading-tight">
            연금·퇴직금·상속 세금이 궁금할 때
          </p>
          <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-1 font-semibold group-hover:text-blue-300 transition-colors">
            <span>카카오톡으로 문의하기</span>
            <span>→</span>
          </p>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-6 bg-white dark:bg-[#11192E] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 relative z-50 gap-3">
          {/* Breadcrumb + Mode Status Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>재무설계</span>
              <span className="text-slate-400">›</span>
              <span className="text-slate-800 dark:text-white font-bold">
                {currentStep === "step1" && "STEP 01 설계안 등록"}
                {currentStep === "step2" && "STEP 02 월별 변동 입력"}
                {currentStep === "step3" && "STEP 03 Gemini AI 재무상담"}
                {currentStep === "financial_status" && "내 재무현황 (재무상태표 & 현금흐름표)"}
                {currentStep === "report" && "공인 은퇴설계 종합 진단 리포트"}
              </span>
            </div>

            {/* Quick Mode Status & Switcher */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleRestoreUserCustomData}
                className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                title="내가 직접 입력했던 재무 데이터로 즉시 복원"
              >
                <span>✍️ 내가 쓴 재무 데이터 불러오기</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSupabaseData}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95 ${
                  !isTemplateBlank
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200"
                }`}
                title="대회 가상 고객(50대 은퇴설계) 모범 데이터 조회"
              >
                <span>✦ 가상 고객 모범안</span>
              </button>

              <button
                type="button"
                onClick={handleResetToBlank}
                className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                title="모든 항목을 공란으로 비워 신규 고객 작성 시작"
              >
                <span>↩️ 공란 초기화</span>
              </button>
            </div>
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

              {/* Blank Mode Guidance Banner */}
              {isTemplateBlank && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="text-xl">📝</span>
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        신규 고객 직접 입력 양식:{" "}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        모든 항목이 공란으로 준비되었습니다. 고객의 실제 자산, 부채, 소득, 지출을 입력하시면 실시간 맞춤 재무설계안이 완성됩니다.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSupabaseData}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex-shrink-0 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    🔄 Supabase 데이터 불러오기
                  </button>
                </div>
              )}

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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        기본 재무정보 입력
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        자산·부채·월 수지 및 핵심 목표를 입력하시면 실시간으로 자동 연산되고 안전하게 보존됩니다
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRestoreUserCustomData}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-95"
                    >
                      <span>✍️</span>
                      <span>내가 쓴 데이터 불러오기</span>
                    </button>
                  </div>

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
                          inputMode="numeric"
                          value={totalAsset}
                          onChange={(e) => {
                            const val = formatCalculatorNumber(e.target.value);
                            setTotalAsset(val);
                            saveUserCustomData("totalAsset", val);
                          }}
                          placeholder="0"
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
                          inputMode="numeric"
                          value={totalDebt}
                          onChange={(e) => {
                            const val = formatCalculatorNumber(e.target.value);
                            setTotalDebt(val);
                            saveUserCustomData("totalDebt", val);
                          }}
                          placeholder="0"
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
                          inputMode="numeric"
                          value={monthlyIncome}
                          onChange={(e) => {
                            const val = formatCalculatorNumber(e.target.value);
                            setMonthlyIncome(val);
                            saveUserCustomData("monthlyIncome", val);
                          }}
                          placeholder="0"
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
                          inputMode="numeric"
                          value={monthlyExpense}
                          onChange={(e) => {
                            const val = formatCalculatorNumber(e.target.value);
                            setMonthlyExpense(val);
                            saveUserCustomData("monthlyExpense", val);
                          }}
                          placeholder="0"
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
                          inputMode="numeric"
                          value={emergencyFund}
                          onChange={(e) => {
                            const val = formatCalculatorNumber(e.target.value);
                            setEmergencyFund(val);
                            saveUserCustomData("emergencyFund", val);
                          }}
                          placeholder="0"
                          className="w-full text-right text-xs font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 ml-2">원</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                        (월 지출의 약 {calcEmergencyMonths}개월분)
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
                          onChange={(e) => {
                            setGoalName(e.target.value);
                            saveUserCustomData("goalName", e.target.value);
                          }}
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
                            inputMode="numeric"
                            value={goalAmount}
                            onChange={(e) => {
                              const val = formatCalculatorNumber(e.target.value);
                              setGoalAmount(val);
                              saveUserCustomData("goalAmount", val);
                            }}
                            placeholder="0"
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
                          onChange={(e) => {
                            setGoalDate(e.target.value);
                            saveUserCustomData("goalDate", e.target.value);
                          }}
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
                      onClick={() => {
                        const payload = {
                          totalAsset,
                          totalDebt,
                          monthlyIncome,
                          monthlyExpense,
                          emergencyFund,
                          goalName,
                          goalAmount,
                          goalDate,
                          monthlyRecords,
                          hasUserData: true,
                        };
                        try {
                          localStorage.setItem(USER_PERSISTENT_KEY, JSON.stringify(payload));
                          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, isTemplateBlank }));
                        } catch (e) {
                          console.error(e);
                        }
                        alert("STEP 01 재무설계안이 안전하게 저장되었습니다.\n상단의 [내가 쓴 재무 데이터 불러오기]를 누르면 언제든 즉시 복원됩니다.");
                        setCurrentStep("step2");
                      }}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <span>저장하고 다음 단계로</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* Right Summary Column: 실시간 계산 반영 */}
                <div className="lg:col-span-4 space-y-4">
                  {/* 입력 요약 */}
                  <div className="bg-white dark:bg-[#11192E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                        입력 요약
                      </h4>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        실시간 계산 반영
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>🏠</span> 총 자산
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 dark:text-white">
                            {formatKoreanCurrency(parsedAsset)}
                          </span>
                          {parsedAsset > 0 && (
                            <span className="text-[10px] text-slate-400 block">
                              {parsedAsset.toLocaleString("ko-KR")}원
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>💳</span> 총 부채
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 dark:text-white">
                            {formatKoreanCurrency(parsedDebt)}
                          </span>
                          {parsedDebt > 0 && (
                            <span className="text-[10px] text-slate-400 block">
                              {parsedDebt.toLocaleString("ko-KR")}원
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>💰</span> 순자산
                        </span>
                        <div className="text-right">
                          <span className={`font-bold ${calcNetWorth >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}`}>
                            {formatKoreanCurrency(calcNetWorth)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {calcNetWorth.toLocaleString("ko-KR")}원
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 월 현금흐름 */}
                  <div className="bg-white dark:bg-[#11192E] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                        월 현금흐름
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        월 기준
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>💵</span> 월 소득
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 dark:text-white">
                            {formatKoreanCurrency(parsedIncome)}
                          </span>
                          {parsedIncome > 0 && (
                            <span className="text-[10px] text-slate-400 block">
                              {parsedIncome.toLocaleString("ko-KR")}원
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span>🧾</span> 월 지출
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 dark:text-white">
                            {formatKoreanCurrency(parsedExpense)}
                          </span>
                          {parsedExpense > 0 && (
                            <span className="text-[10px] text-slate-400 block">
                              {parsedExpense.toLocaleString("ko-KR")}원
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border flex justify-between items-center ${
                        calcSurplus >= 0
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                          : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                      }`}>
                        <div>
                          <div className={`text-[11px] font-semibold ${
                            calcSurplus >= 0
                              ? "text-emerald-800 dark:text-emerald-300"
                              : "text-red-800 dark:text-red-300"
                          }`}>
                            {calcSurplus >= 0 ? "월 저축가능액 (잉여)" : "월 적자"}
                          </div>
                          <div className={`text-[10px] font-medium ${
                            calcSurplus >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            (저축률 {calcSavingsRate}%)
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-extrabold ${
                            calcSurplus >= 0
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            {formatKoreanCurrency(calcSurplus)}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            {calcSurplus.toLocaleString("ko-KR")}원
                          </span>
                        </div>
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
                            ? `${formatKoreanCurrency(parseNumber(goalAmount))} • ${goalDate}`
                            : goalAmount
                            ? `${formatKoreanCurrency(parseNumber(goalAmount))} • 일정 미설정`
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
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-semibold mb-1">
                    <span>📊</span>
                    <span>월별 현금흐름 및 자산 변동 모니터링</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    STEP 02 월별 변동 입력 + 자동 분석
                  </h2>
                  <p className="text-xs md:text-sm text-blue-100 max-w-xl">
                    매월의 수입, 지출, 자산·부채 변동을 입력하여 전월 대비 증감(MoM)과 순자산 추이를 자동으로 분석해요.
                  </p>
                </div>

                {/* Interactive Month Selector */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 z-10 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectMonth(selectedMonth === "2026-10" ? "2026-09" : "2026-10")}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-blue-200 transition-colors text-sm font-bold"
                    title="이전/다음 달 전환"
                  >
                    ‹
                  </button>
                  <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleSelectMonth("2026-09")}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        selectedMonth === "2026-09"
                          ? "bg-white text-blue-900 shadow-md scale-105"
                          : "text-blue-200 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      2026년 9월
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMonth("2026-10")}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        selectedMonth === "2026-10"
                          ? "bg-white text-blue-900 shadow-md scale-105"
                          : "text-blue-200 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      2026년 10월
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectMonth(selectedMonth === "2026-09" ? "2026-10" : "2026-09")}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-blue-200 transition-colors text-sm font-bold"
                    title="이전/다음 달 전환"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Step 2 Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Form: 월별 재무 입력 */}
                <div className="lg:col-span-5 bg-white dark:bg-[#11192E] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        {MONTHLY_FINANCE_DATA[selectedMonth].label} 재무 입력
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {!isTemplateBlank
                          ? (selectedMonth === "2026-10" ? "Supabase 10월 현금흐름표 상세 실데이터" : "Supabase 9월 현금흐름표 가상 실데이터")
                          : "신규 고객 월별 재무 데이터 직접 입력"}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                      {MONTHLY_FINANCE_DATA[selectedMonth].shortLabel}
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* 월 수입 */}
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">월 수입 (급여, 기타소득)</span>
                        {!isTemplateBlank && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">
                            ({MONTHLY_FINANCE_DATA[selectedMonth].incomeSub})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">💵</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={monthlyRecords[selectedMonth].income}
                          onChange={(e) => updateCurrentMonthRecord("income", formatCalculatorNumber(e.target.value))}
                          placeholder="0"
                          className="w-full text-right font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    {/* 고정지출 */}
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">고정지출 (주거, 통신, 보험 등)</span>
                        {!isTemplateBlank && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">
                            ({MONTHLY_FINANCE_DATA[selectedMonth].fixedSub})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">🏠</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={monthlyRecords[selectedMonth].fixedExpense}
                          onChange={(e) => updateCurrentMonthRecord("fixedExpense", formatCalculatorNumber(e.target.value))}
                          placeholder="0"
                          className="w-full text-right font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    {/* 변동지출 */}
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">변동지출 (식비, 교통, 여가 등)</span>
                        {!isTemplateBlank && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">
                            ({MONTHLY_FINANCE_DATA[selectedMonth].variableSub})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">🍔</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={monthlyRecords[selectedMonth].variableExpense}
                          onChange={(e) => updateCurrentMonthRecord("variableExpense", formatCalculatorNumber(e.target.value))}
                          placeholder="0"
                          className="w-full text-right font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    {/* 투자/저축 */}
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">투자/저축 (적립금, 펀드, 주식 등)</span>
                        {!isTemplateBlank && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400">
                            ({MONTHLY_FINANCE_DATA[selectedMonth].investmentSub})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">📈</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={monthlyRecords[selectedMonth].investment}
                          onChange={(e) => updateCurrentMonthRecord("investment", formatCalculatorNumber(e.target.value))}
                          placeholder="0"
                          className="w-full text-right font-bold bg-transparent text-slate-800 dark:text-white focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    {/* 자산 변화 */}
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">자산 변화 (매입/매도·평가변동)</span>
                        {!isTemplateBlank && (
                          <span className="text-[10px] text-slate-400">
                            ({MONTHLY_FINANCE_DATA[selectedMonth].assetSub})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">✨</span>
                        <input
                          type="text"
                          value={monthlyRecords[selectedMonth].assetChange}
                          onChange={(e) => updateCurrentMonthRecord("assetChange", formatSignedCalculatorNumber(e.target.value))}
                          placeholder="0"
                          className="w-full text-right font-bold bg-transparent text-blue-600 dark:text-blue-400 focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>

                    {/* 부채 변화 */}
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">부채 변화 (대출상환/신규)</span>
                        {!isTemplateBlank && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            ({MONTHLY_FINANCE_DATA[selectedMonth].debtSub})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="mr-2">💳</span>
                        <input
                          type="text"
                          value={monthlyRecords[selectedMonth].debtChange}
                          onChange={(e) => updateCurrentMonthRecord("debtChange", formatSignedCalculatorNumber(e.target.value))}
                          placeholder="0"
                          className="w-full text-right font-bold bg-transparent text-emerald-600 dark:text-emerald-400 focus:outline-none"
                        />
                        <span className="ml-2 text-slate-400">원</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const existing = localStorage.getItem(USER_PERSISTENT_KEY);
                        const data = existing ? JSON.parse(existing) : {};
                        data.monthlyRecords = monthlyRecords;
                        data.hasUserData = true;
                        localStorage.setItem(USER_PERSISTENT_KEY, JSON.stringify(data));
                        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, isTemplateBlank }));
                      } catch (e) {
                        console.error(e);
                      }
                      alert(`${MONTHLY_FINANCE_DATA[selectedMonth].label} 재무 데이터가 안전하게 저장되었습니다.\n상단의 [내가 쓴 재무 데이터 불러오기]를 누르면 언제든 즉시 복원됩니다.`);
                    }}
                    className="w-full py-3 rounded-xl bg-[#1B3574] hover:bg-[#142857] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>💾</span>
                    <span>{MONTHLY_FINANCE_DATA[selectedMonth].label} 저장하기</span>
                  </button>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("step1")}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      이전 단계
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const existing = localStorage.getItem(USER_PERSISTENT_KEY);
                          const data = existing ? JSON.parse(existing) : {};
                          data.monthlyRecords = monthlyRecords;
                          data.hasUserData = true;
                          localStorage.setItem(USER_PERSISTENT_KEY, JSON.stringify(data));
                        } catch (e) {
                          console.error(e);
                        }
                        setCurrentStep("step3");
                      }}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                    >
                      <span>AI 상담 가기</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* Right Analysis Column: 월별 재무 변동 분석 및 비교 */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Top Metric Cards (순자산 및 월 잉여금) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {MONTHLY_FINANCE_DATA[selectedMonth].label} 순자산
                      </div>
                      <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
                        {isTemplateBlank
                          ? (calcNetWorth !== 0 ? formatKoreanCurrency(calcNetWorth) : "0원 (입력 대기)")
                          : formatKoreanCurrency(currentMonthNetWorth)}
                      </div>
                      {!isTemplateBlank && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                          <span>▲ +102만 원</span>
                          <span className="text-slate-400 font-normal">(대출원금 상환 반영)</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {MONTHLY_FINANCE_DATA[selectedMonth].label} 월 잉여금 (저축가능액)
                      </div>
                      <div className={`text-xl font-extrabold mt-1 ${currentMonthSurplus >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {(currentMonthSurplus >= 0 ? "+" : "") + currentMonthSurplus.toLocaleString("ko-KR")}원
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">
                        수입 {currentMonthIncome.toLocaleString("ko-KR")}원 / 지출 {currentMonthTotalExpense.toLocaleString("ko-KR")}원
                      </div>
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
                {/* Left Column: AI 중점 상담 목표, 현재 재무상태 요약 & AI 추천 질문 가이드 */}
                <div className="lg:col-span-5 space-y-4">
                  {/* 🎯 AI 중점 상담 목표 카드 (STEP 01 재무 목표 연동) */}
                  {(() => {
                    const effGoalName = goalName ? goalName : (isTemplateBlank ? "목표 설정 대기" : "은퇴 후 생활비 300만원 마련");
                    const effGoalAmount = goalAmount ? formatKoreanCurrency(parseNumber(goalAmount)) : (isTemplateBlank ? "0원" : "6억 8,800만 원");
                    const effGoalDate = goalDate ? goalDate : (isTemplateBlank ? "시점 미정" : "60세 은퇴 시점");
                    return (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold">
                              🎯
                            </span>
                            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              AI 중점 상담 목표 (STEP 01 연동)
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                            최우선 분석
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-100 dark:border-amber-900/40 space-y-1.5">
                          <div className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <span>{effGoalName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-amber-100/60 dark:border-slate-800">
                            <div>
                              <span className="text-slate-400">필요 자금: </span>
                              <span className="font-bold text-amber-700 dark:text-amber-400">
                                {effGoalAmount}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">달성 시점: </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {effGoalDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                          💡 Gemini 재무주치의는 고객님의 이 재무 목표를 최우선으로 달성하기 위한 구체적인 저축·투자·상환 전략을 안내합니다.
                        </p>

                        <div className="pt-1 flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={handleTriggerAiGoalEvaluation}
                            disabled={isAiEvaluating}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                          >
                            {isAiEvaluating ? (
                              <>
                                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>{evaluatedModelName} 모델로 정밀 진단 중...</span>
                              </>
                            ) : (
                              <>
                                <span>✨</span>
                                <span>{evaluatedModelName} 재무목표 정밀 진단 실행</span>
                              </>
                            )}
                          </button>
                          {aiEvaluatedGoals && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold text-center flex items-center justify-center gap-1">
                              <span>✓</span>
                              <span>{evaluatedModelName} AI 정밀 진단 결과 반영됨 (리포트 연동)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 현재 재무상태 요약 (10월 실데이터 기준) */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span>📊</span>
                        <span>현재 재무상태 요약</span>
                      </h4>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                        2026년 10월 실적 기준
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] text-slate-500 font-medium">
                          🏠 총 자산
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                          {isTemplateBlank
                            ? (totalAsset ? formatKoreanCurrency(parseNumber(totalAsset)) : "0원")
                            : "17억 2,171만 원"}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-[10px] text-slate-500 font-medium">
                          💳 총 부채
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                          {isTemplateBlank
                            ? (totalDebt ? formatKoreanCurrency(parseNumber(totalDebt)) : "0원")
                            : "2억 5,000만 원"}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                        <div className="text-[10px] text-blue-800 dark:text-blue-300 font-bold">
                          💰 순자산
                        </div>
                        <div className="text-xs font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                          {isTemplateBlank
                            ? (calcNetWorth !== 0 ? formatKoreanCurrency(calcNetWorth) : "0원")
                            : "14억 7,171만 원"}
                        </div>
                        {!isTemplateBlank && (
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            ▲ +102만 (상환)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{isTemplateBlank ? "월 소득" : "10월 월 소득"}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {isTemplateBlank
                            ? (monthlyIncome ? monthlyIncome + "원" : "0원")
                            : "805만 원"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{isTemplateBlank ? "월 지출" : "10월 월 지출"}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {isTemplateBlank
                            ? (monthlyExpense ? monthlyExpense + "원" : "0원")
                            : "733만 원 (원리금 185만 포함)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{isTemplateBlank ? "월 잉여금" : "10월 잉여금"}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {isTemplateBlank
                            ? (calcSurplus !== 0 ? (calcSurplus >= 0 ? "+" : "") + calcSurplus.toLocaleString("ko-KR") + "원" : "0원")
                            : "72만 원 (저축률 8.9%)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI 추천 질문 카테고리 가이드 (4대 고객 유형별 5대 질문) */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>💡</span>
                          <span>추천 질문 가이드 (5대 핵심 질문)</span>
                        </h4>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                          {CONCERN_QUESTIONS_MAP[activeConcernKey]?.title || "맞춤 질문"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        클릭하시면 질문 내용이 채팅창에 바로 입력돼요
                      </p>

                      {/* 4대 고민 유형 전환 탭 */}
                      <div className="grid grid-cols-2 gap-1 pt-1">
                        {[
                          { key: "debt", label: "부채 상환", icon: "💳" },
                          { key: "wedding", label: "결혼자금", icon: "🎁" },
                          { key: "living", label: "은퇴생활비", icon: "🏖️" },
                          { key: "inheritance", label: "상속·절세", icon: "🏛️" },
                        ].map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => {
                              const k = t.key as "debt" | "wedding" | "living" | "inheritance";
                              setUserConcern(CONCERN_QUESTIONS_MAP[k].title);
                              setGoalName(CONCERN_QUESTIONS_MAP[k].defaultGoal);
                              setGoalAmount(CONCERN_QUESTIONS_MAP[k].defaultAmount);
                              setGoalDate(CONCERN_QUESTIONS_MAP[k].defaultDate);
                              setMessages(createInitialMessages(k));
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                              activeConcernKey === t.key
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {(CONCERN_QUESTIONS_MAP[activeConcernKey]?.questions || CONCERN_QUESTIONS_MAP.living.questions).map((qText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputMessage(qText)}
                          className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-100 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <span>Q{idx + 1}.</span>
                              <span>질문 {idx + 1}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-medium">
                              질문 채우기 ↵
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 leading-snug">
                            {qText}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("step2")}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      ← STEP 02로 이동
                    </button>
                    <Link
                      href="/"
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                    >
                      홈으로 돌아가기
                    </Link>
                  </div>
                </div>

                {/* Right Column: AI Chat Panel */}
                <div className="lg:col-span-7 bg-white dark:bg-[#11192E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[700px] overflow-hidden">
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
                            <div className="px-4 py-3 rounded-2xl rounded-tr-none bg-blue-600 text-white text-xs font-medium shadow-sm leading-relaxed">
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
                            <div className="space-y-2.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                  Gemini 재무주치의
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {msg.time}
                                </span>
                              </div>

                              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-100 space-y-3 leading-relaxed">
                                <div className="font-semibold text-slate-900 dark:text-white text-[13px] whitespace-pre-line leading-relaxed">
                                  {msg.details?.suggestions?.length
                                    ? msg.text.split("### 다음 행동 제안")[0].trim()
                                    : msg.text}
                                </div>

                                {msg.details && (
                                  <div className="space-y-3 pt-1">
                                    {/* 핵심 예상 효과 요약 카드 (너무 확정적인 고정 날짜 대신 유연한 추정 범위 안내) */}
                                    {Array.isArray(msg.details.summary) && msg.details.summary.length > 0 && (
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {msg.details.summary.map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs"
                                          >
                                            <div className="text-[10px] text-slate-500 font-medium">
                                              {item.label}
                                            </div>
                                            <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                                              {item.value}
                                            </div>
                                            {item.note && (
                                              <div className="text-[9px] text-slate-400 mt-0.5">
                                                {item.note}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* 기존 basis & comparison 호환 렌더링 (있는 경우) */}
                                    {Array.isArray(msg.details.basis) && Array.isArray(msg.details.comparison) && (
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
                                            {msg.details.comparison.map((c, i) => (
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
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 다음 행동 제안 */}
                                    {Array.isArray(msg.details.suggestions) && msg.details.suggestions.length > 0 && (
                                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                                        <div className="text-[11px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                          <span>💡</span>
                                          <span>다음 행동 제안</span>
                                        </div>
                                        <div className="space-y-1.5">
                                          {msg.details.suggestions.map((s, i) => (
                                            <div
                                              key={i}
                                              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs flex items-start gap-2.5"
                                            >
                                              <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                                                {i + 1}
                                              </span>
                                              <span className="text-slate-700 dark:text-slate-200 leading-snug">
                                                {s}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
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

                  {/* Input Box: 파일칸 제거 & 명확한 플레이스홀더 제공 */}
                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
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
                      className="flex-1 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isAiTyping || !inputMessage.trim()}
                      className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
                      title="질문 전송"
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

          {/* 내 재무현황 종합 분석표 (Supabase 실데이터 연동) */}
          {currentStep === "financial_status" && (
            <FinancialStatusView
              onNavigateStep={(step) => setCurrentStep(step)}
              onOpenTaxModal={() => setShowTaxModal(true)}
              isTemplateBlank={isTemplateBlank}
              onLoadSupabaseData={handleLoadSupabaseData}
              totalAsset={totalAsset}
              totalDebt={totalDebt}
              monthlyIncome={monthlyIncome}
              monthlyExpense={monthlyExpense}
              emergencyFund={emergencyFund}
              goalName={goalName}
              goalAmount={goalAmount}
              goalDate={goalDate}
              monthlyRecords={monthlyRecords}
            />
          )}



          {/* 리포트 (재무상태표, 현금흐름표, 재무목표 기반 종합 진단서) */}
          {currentStep === "report" && (
            <ReportView
              onNavigateStep={(step) => setCurrentStep(step)}
              onOpenTaxModal={() => setShowTaxModal(true)}
              isTemplateBlank={isTemplateBlank}
              onLoadSupabaseData={handleLoadSupabaseData}
              totalAsset={totalAsset}
              totalDebt={totalDebt}
              monthlyIncome={monthlyIncome}
              monthlyExpense={monthlyExpense}
              emergencyFund={emergencyFund}
              goalName={goalName}
              goalAmount={goalAmount}
              goalDate={goalDate}
              aiGoals={aiEvaluatedGoals || undefined}
              aiSolutions={aiEvaluatedSolutions || undefined}
              isAiEvaluating={isAiEvaluating}
              onTriggerAiEvaluation={handleTriggerAiGoalEvaluation}
              evaluatedModelName={evaluatedModelName}
            />
          )}
        </main>
      </div>

      {/* 한OO 세무사 카카오톡 QR 상담 모달 (Image 2 기반) */}
      {showTaxModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowTaxModal(false)}
        >
          <div
            className="w-full max-w-[320px] rounded-2xl bg-[#141E33] border border-slate-700/80 p-6 shadow-2xl relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                한OO 세무사
              </h3>
              <button
                type="button"
                onClick={() => setShowTaxModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* White Box with Original QR Code */}
            <div className="bg-white rounded-2xl p-3 my-4 flex items-center justify-center shadow-md">
              <img
                src="/images/tax_qr.png"
                alt="한OO 세무사 카카오톡 QR코드"
                className="w-48 h-48 object-contain rounded-lg"
              />
            </div>

            {/* Kakao CTA Button */}
            <a
              href="https://open.kakao.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.25 4.54 6.63-.2.74-.75 2.76-.86 3.19-.14.54.2.53.42.39.29-.19 3.96-2.67 4.58-3.1.44.06.87.09 1.32.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              <span>카카오톡으로 연결</span>
            </a>

            {/* Copy Kakao ID Button */}
            <button
              type="button"
              onClick={handleCopyKakaoId}
              className="w-full text-center text-[11px] text-slate-400 hover:text-white mt-3 py-1 transition-colors cursor-pointer"
            >
              {copiedKakaoId ? "✓ 세무사 카카오톡 ID 복사 완료!" : "카카오톡 ID 복사"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
