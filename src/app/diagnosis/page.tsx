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
  if (remainder > 0 && parts.length === 0) parts.push(`${remainder.toLocaleString("ko-KR")}`);

  const formatted = (parts.join(" ") + "원").trim();
  return isNegative ? `-${formatted}` : formatted;
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
        if (savedConcern) {
          setUserConcern(savedConcern);
          if (!savedGoal) {
            if (savedConcern.includes("대출")) {
              setGoalName("은퇴 전 대출 2.5억 전액 상환");
            } else if (savedConcern.includes("결혼") || savedConcern.includes("자녀")) {
              setGoalName("장남 결혼자금 7,000만 원 마련");
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "user",
      time: "오후 2:14",
      text: "이번 달 남은 잉여금 72만 원 중 40만 원을 연금저축·IRP에 더 넣으면 은퇴 준비에 어떤 효과가 있나요?",
    },
    {
      id: "2",
      sender: "gemini",
      time: "오후 2:14",
      text: "월 40만 원(연 480만 원)을 개인형 IRP 및 연금저축에 추가 납입하시면, 연간 약 63만~79만 원의 세액공제(절세) 혜택과 함께 은퇴 시 매월 약 25만~35만 원 수준의 추가 생활비 재원을 안정적으로 확보할 수 있습니다. 🎯",
      details: {
        summary: [
          {
            label: "연간 절세 혜택 (세액공제)",
            value: "약 63.3만 ~ 79.2만 원",
            note: "소득 구간별 13.2%~16.5% 환급",
          },
          {
            label: "10년 운용 시 자산 형성",
            value: "약 5,800만 ~ 6,200만 원",
            note: "연 4~5% 복리 수익률 가정",
          },
          {
            label: "은퇴 후 연금 수령 추정",
            value: "월 약 25만 ~ 35만 원",
            note: "20년 분할 수령 기준",
          },
        ],
        suggestions: [
          "연말정산 세액공제 한도(900만 원) 우선 활용: 기존 연금 불입액에 480만 원 추가 시 100% 공제 혜택을 누릴 수 있습니다.",
          "담보대출 분할상환과의 조율: 아파트 담보대출(연 4%) 원금 상환을 차질 없이 유지하면서 연금 복리 효과를 함께 챙기세요.",
          "비상예비자금 30만 원 유지: 남은 월 잉여금(32만 원)은 수시입출금 파킹통장/CMA에 비축하여 유동성을 확보하세요.",
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
            isCustomUser: isTemplateBlank,
            goal: goalName || (isTemplateBlank ? "은퇴 재무목표" : "은퇴 후 월 생활비 300만원 마련"),
            goalAmount: goalAmount ? `${goalAmount}원` : (isTemplateBlank ? "0원" : "6억 8,800만 원"),
            goalDate: goalDate || (isTemplateBlank ? "시점 미정" : "60세 은퇴 시점"),
            assets: `총자산: ${totalAsset || "0"}원, 총부채: ${totalDebt || "0"}원, 순자산: ${calcNetWorth.toLocaleString()}원`,
            cashflow: `월 소득: ${monthlyIncome || "0"}원, 월 지출: ${monthlyExpense || "0"}원, 현재 월 잉여금: ${calcSurplus.toLocaleString()}원, 비상예비자금: ${emergencyFund || "0"}원`,
            step2Monthly: {
              rec10: {
                income: rec10.income,
                fixedExpense: rec10.fixedExpense,
                variableExpense: rec10.variableExpense,
                investment: rec10.investment,
                debtChange: rec10.debtChange,
              },
              rec9: {
                income: rec9.income,
                fixedExpense: rec9.fixedExpense,
                variableExpense: rec9.variableExpense,
                investment: rec9.investment,
                debtChange: rec9.debtChange,
              },
            },
            retirementDeficit: isTemplateBlank ? `-${parsedExpense.toLocaleString()}원` : "-592만 원",
            emergencyMonths: parsedExpense > 0 ? (parsedEmergency / parsedExpense).toFixed(1) : "0",
            concern: userConcern || `${goalName || "재무목표"} 달성 및 현금흐름 최적화`,
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
              onClick={() => setCurrentStep("goals")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === "goals"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
              <span>목표 관리</span>
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
                {currentStep === "goals" && "재무목표 관리 (4대 목표 진단 & 솔루션)"}
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

                  {/* 월별 재무 변동 비교 테이블 (Supabase 9월 vs 10월) */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                          월별 재무 변동 비교 (2026년 9월 vs 10월)
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {!isTemplateBlank ? "Supabase 실데이터 연동 (9월 가상 vs 10월 상세)" : "신규 고객 직접 입력 실데이터 비교"}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 self-start sm:self-auto">
                        단위: 원, 만 원
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/60 dark:bg-slate-900/60">
                            <th className="py-2.5 px-3">항목</th>
                            <th className="py-2.5 px-3">9월 실적</th>
                            <th className="py-2.5 px-3">10월 실적</th>
                            <th className="py-2.5 px-3">전월비 증감 (MoM)</th>
                            <th className="py-2.5 px-3">변동 내역 및 사유</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {/* 월 수입 */}
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              월 수입 합계
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {m9Income.toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">
                              {m10Income.toLocaleString("ko-KR")}원
                            </td>
                            <td className={`py-2.5 px-3 font-semibold ${m10Income >= m9Income ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                              {m10Income >= m9Income ? "▲ +" : "▼ "}
                              {Math.abs(m10Income - m9Income).toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              {!isTemplateBlank ? "금융 배당소득 증가 (4만 → 5만 원)" : "-"}
                            </td>
                          </tr>

                          {/* 고정지출 */}
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              고정지출 합계
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {m9Fixed.toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">
                              {m10Fixed.toLocaleString("ko-KR")}원
                            </td>
                            <td className={`py-2.5 px-3 font-semibold ${m10Fixed <= m9Fixed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                              {m10Fixed >= m9Fixed ? "▲ +" : "▼ "}
                              {Math.abs(m10Fixed - m9Fixed).toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              {!isTemplateBlank ? "아파트 관리비 증가 (32만 → 35만 원)" : "-"}
                            </td>
                          </tr>

                          {/* 변동지출 */}
                          <tr className="bg-amber-50/30 dark:bg-amber-950/20">
                            <td className="py-2.5 px-3 font-semibold text-amber-900 dark:text-amber-200">
                              변동지출 합계
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {m9Variable.toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 font-bold text-amber-700 dark:text-amber-300">
                              {m10Variable.toLocaleString("ko-KR")}원
                            </td>
                            <td className={`py-2.5 px-3 font-semibold ${m10Variable <= m9Variable ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                              {m10Variable >= m9Variable ? "▲ +" : "▼ "}
                              {Math.abs(m10Variable - m9Variable).toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-amber-800 dark:text-amber-300">
                              {!isTemplateBlank ? "여가·골프(+15만), 의료(+5만), 식비(+5만), 경조(+5만)" : "-"}
                            </td>
                          </tr>

                          {/* 투자/저축 */}
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              투자 및 저축
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {m9Invest.toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">
                              {m10Invest.toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 font-medium">
                              {m10Invest === m9Invest ? "- (동일)" : `${m10Invest > m9Invest ? "▲ +" : "▼ "}${Math.abs(m10Invest - m9Invest).toLocaleString("ko-KR")}원`}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              {!isTemplateBlank ? "연금저축 및 개인형IRP 정기 불입" : "-"}
                            </td>
                          </tr>

                          {/* 총 지출 */}
                          <tr className="bg-slate-50 dark:bg-slate-900/50">
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                              총 지출 합계
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {m9TotalExpense.toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">
                              {m10TotalExpense.toLocaleString("ko-KR")}원
                            </td>
                            <td className={`py-2.5 px-3 font-bold ${m10TotalExpense <= m9TotalExpense ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                              {m10TotalExpense >= m9TotalExpense ? "▲ +" : "▼ "}
                              {Math.abs(m10TotalExpense - m9TotalExpense).toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              {!isTemplateBlank ? "변동지출 및 관리비 증가로 지출 확대" : "-"}
                            </td>
                          </tr>

                          {/* 월 잉여금 */}
                          <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                            <td className="py-2.5 px-3 font-bold text-emerald-800 dark:text-emerald-300">
                              월 잉여금 (저축가능액)
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                              {(m9Surplus >= 0 ? "+" : "") + m9Surplus.toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 font-extrabold text-emerald-700 dark:text-emerald-300">
                              {(m10Surplus >= 0 ? "+" : "") + m10Surplus.toLocaleString("ko-KR")}원
                            </td>
                            <td className={`py-2.5 px-3 font-bold ${m10Surplus >= m9Surplus ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {m10Surplus >= m9Surplus ? "▲ +" : "▼ "}
                              {Math.abs(m10Surplus - m9Surplus).toLocaleString("ko-KR")}원
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                              {!isTemplateBlank ? "지출 증가로 잉여 감소 반영" : "-"}
                            </td>
                          </tr>

                          {/* 부채 상환 */}
                          <tr>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              부채 상환 (원금)
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {rec9.debtChange || "0"}원
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {rec10.debtChange || "0"}원
                            </td>
                            <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                              {!isTemplateBlank ? "✓ 정상 분할상환" : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              {!isTemplateBlank ? "아파트 담보대출 원금 매월 정기 상환" : "-"}
                            </td>
                          </tr>

                          {/* 순자산 */}
                          <tr className="bg-blue-50/50 dark:bg-blue-950/30">
                            <td className="py-2.5 px-3 font-bold text-blue-900 dark:text-blue-200">
                              순자산
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                              {isTemplateBlank
                                ? (calcNetWorth !== 0 ? formatKoreanCurrency(calcNetWorth) : "0원")
                                : formatKoreanCurrency(m9NetWorth)}
                            </td>
                            <td className="py-2.5 px-3 font-extrabold text-blue-700 dark:text-blue-300">
                              {isTemplateBlank
                                ? (calcNetWorth !== 0 ? formatKoreanCurrency(calcNetWorth) : "0원")
                                : formatKoreanCurrency(m10NetWorth)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                              {isTemplateBlank
                                ? "- (동일)"
                                : `▲ +${formatKoreanCurrency(m10NetWorth - m9NetWorth)}`}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                              {isTemplateBlank ? "직접 입력한 자산·부채 기준 순자산" : "대출원금 상환으로 순자산 지속 증가"}
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

                  {/* AI 추천 질문 카테고리 가이드 */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#11192E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>💡</span>
                          <span>추천 질문 가이드</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          클릭하시면 질문 내용이 채팅창에 바로 입력돼요
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(() => {
                        const effGoal = goalName || (isTemplateBlank ? "재무 목표" : "은퇴 생활비 300만 원");
                        const effAmt = goalAmount ? (parseNumber(goalAmount) >= 10000 ? formatKoreanCurrency(parseNumber(goalAmount)) : parseNumber(goalAmount).toLocaleString() + "원") : (isTemplateBlank ? "" : "6억 8,800만 원");
                        const effDt = goalDate || (isTemplateBlank ? "" : "60세 은퇴");
                        const surplusStr = calcSurplus >= 10000 ? formatKoreanCurrency(calcSurplus) : `${calcSurplus.toLocaleString()}원`;
                        const debtStr = parsedDebt >= 10000 ? formatKoreanCurrency(parsedDebt) : `${parsedDebt.toLocaleString()}원`;

                        return [
                          {
                            category: `🎯 [${effGoal}] 달성 자금 전략`,
                            icon: "🎯",
                            question: effAmt
                              ? `목표 자금 ${effAmt} (${effDt})을 달성하기 위해 매월 얼마의 저축과 연 몇 %의 목표 수익률이 필요한가요?`
                              : `"${effGoal}" 목표를 달성하려면 매월 얼마씩 어떤 포트폴리오(IRP·연금저축·ISA)로 모아야 하나요?`,
                            desc: effAmt ? `목표 자금 ${effAmt} (${effDt}) 맞춤 자금 솔루션` : "목표 자금 마련을 위한 저축·투자 포트폴리오",
                          },
                          {
                            category: "💰 잉여금 활용 & 연금 극대화",
                            icon: "💰",
                            question: calcSurplus > 0
                              ? `이번 달 남은 잉여금 ${surplusStr} 중 ${(Math.round(calcSurplus * 0.5)).toLocaleString()}원을 IRP·연금저축에 더 넣으면 "${effGoal}" 준비에 어떤 효과가 있나요?`
                              : `현재 월 잉여금이 부족한 상태인데, 월 지출을 줄여 "${effGoal}" 준비금을 마련하려면 어디서부터 줄여야 할까요?`,
                            desc: calcSurplus > 0 ? `실시간 계산된 월 잉여금(${surplusStr}) 기반 절세 및 자산 형성 효과` : "지출 다이어트를 통한 목표 자금 확보안",
                          },
                          {
                            category: "💳 부채 상환 vs 목표 저축",
                            icon: "💳",
                            question: parsedDebt > 0
                              ? `현재 부채(${debtStr}) 원금 상환과 "${effGoal}" 자금 마련 중 어떤 것에 우선순위를 두어야 유리한가요?`
                              : `부채가 없는 상태에서 매월 발생하는 잉여금을 "${effGoal}" 달성을 위해 어떻게 포트폴리오를 구성할까요?`,
                            desc: parsedDebt > 0 ? `대출이자 절감과 복리 투자수익 기회비용 비교 (총부채: ${debtStr})` : "무부채 상태에서의 잉여금 최적 배분안",
                          },
                          {
                            category: "📉 STEP 02 변동지출 관리 & 잉여금 확대",
                            icon: "📉",
                            question: `STEP 02의 월별 변동지출(식비·의료·여가)을 고려할 때, "${effGoal}" 달성을 위한 비상금 규모와 잉여금 확대 방안은?`,
                            desc: `실제 월 지출 구조조정으로 "${effGoal}" 준비금 추가 확보`,
                          },
                        ];
                      })().map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputMessage(item.question)}
                          className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-100 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <span>{item.icon}</span>
                              <span>{item.category}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-medium">
                              질문 채우기 ↵
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 leading-snug">
                            {item.question}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.desc}
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
                                <p className="font-semibold text-slate-900 dark:text-white text-[13px]">
                                  {msg.text}
                                </p>

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

          {/* 목표 관리 (4대 재무목표 타임라인 & 신호등 카드 & 솔루션) */}
          {currentStep === "goals" && (
            <GoalsView
              onNavigateStep={(step) => setCurrentStep(step)}
              onOpenTaxModal={() => setShowTaxModal(true)}
              isTemplateBlank={isTemplateBlank}
              onLoadSupabaseData={handleLoadSupabaseData}
              totalAsset={totalAsset}
              totalDebt={totalDebt}
              monthlyIncome={monthlyIncome}
              monthlyExpense={monthlyExpense}
              goalName={goalName}
            />
          )}

          {/* 리포트(PDF) (재무상태표, 현금흐름표, 재무목표 기반 종합 진단서) */}
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
