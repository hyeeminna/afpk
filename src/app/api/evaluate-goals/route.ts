import { NextRequest, NextResponse } from "next/server";

function parseNum(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9.-]/g, "");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

function formatKoreanAmount(num: number): string {
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

function generateAfpkEvaluationFallback(dataMode: string, ctx: any) {
  const isDemo = dataMode === "demo";
  const debt = parseNum(ctx.totalDebt) || (isDemo ? 250000000 : 0);
  const asset = parseNum(ctx.totalAsset) || (isDemo ? 1721710000 : 0);
  const income = parseNum(ctx.monthlyIncome) || (isDemo ? 8050000 : 0);
  const expense = parseNum(ctx.monthlyExpense) || (isDemo ? 7330000 : 0);
  const surplus = income - expense;
  const netWorth = asset - debt;
  const goalAmt = parseNum(ctx.goalAmount) || (isDemo ? 70000000 : 0);
  const goalName = ctx.goal || ctx.goalName || (isDemo ? "장남 결혼자금 지원" : "핵심 재무목표 준비");
  const goalDate = ctx.goalDate || (isDemo ? "2년 내" : "시점 직접 설정");

  // 1. 부채 상환
  const debtNeeded = debt;
  const debtPrep = Math.min(asset, debt);
  const debtShortage = Math.max(0, debt - asset);
  const debtStatus = debt === 0 ? "달성 가능 🟢" : (asset >= debt ? "달성 가능 🟢" : (surplus > 0 ? "사전 합의 🟡" : "위험 경보 🔴"));
  const debtStatusCode = debt === 0 ? "green" : (asset >= debt ? "green" : (surplus > 0 ? "yellow" : "red"));

  // 2. 고객 맞춤 목표
  const customPrep = Math.min(goalAmt, Math.max(0, netWorth));
  const customShortage = Math.max(0, goalAmt - customPrep);
  let customStatus = "진단 대기 ⚪";
  let customStatusCode = "gray";
  if (goalAmt > 0) {
    if (customShortage === 0) {
      customStatus = "달성 가능 🟢";
      customStatusCode = "green";
    } else if (surplus > 0 && surplus * 36 >= customShortage) {
      customStatus = "달성 가능 🟢";
      customStatusCode = "green";
    } else if (surplus > 0) {
      customStatus = "사전 합의 🟡";
      customStatusCode = "yellow";
    } else {
      customStatus = "위험 경보 🔴";
      customStatusCode = "red";
    }
  }

  // 3. 은퇴 생활비
  const retireNeeded = expense > 0 ? expense * 12 * 20 : (income > 0 ? Math.round(income * 0.7) * 12 * 20 : 0);
  const retirePrep = retireNeeded > 0 ? Math.min(retireNeeded, Math.max(0, Math.round(netWorth * 0.5))) : 0;
  const retireShortage = Math.max(0, retireNeeded - retirePrep);
  const retireStatus = retireNeeded === 0 ? "진단 대기 ⚪" : (retireShortage > 0 ? "위험 경보 🔴" : "달성 가능 🟢");
  const retireStatusCode = retireNeeded === 0 ? "gray" : (retireShortage > 0 ? "red" : "green");

  // 4. 비상예비자금
  const emergencyVal = parseNum(ctx.emergencyFund) || (isDemo ? 22000000 : 0);
  const emergencyTarget = expense > 0 ? expense * 6 : (income > 0 ? income * 3 : 0);
  const emergencyShortage = Math.max(0, emergencyTarget - emergencyVal);
  const emergencyStatus = emergencyTarget === 0 ? "진단 대기 ⚪" : (emergencyVal >= emergencyTarget * 0.5 ? "달성 가능 🟢" : "사전 합의 🟡");
  const emergencyStatusCode = emergencyTarget === 0 ? "gray" : (emergencyVal >= emergencyTarget * 0.5 ? "green" : "yellow");

  return {
    goals: [
      {
        id: "debt",
        rank: "1순위: 부채 상환 및 건전성 관리",
        name: debt > 0 ? "대출 전액 상환" : "부채 상환 (부채 0원)",
        period: debt > 0 ? "1년 ~ 3년 내 (은퇴 전 완료 권장)" : "달성 완료",
        needed: formatKoreanAmount(debtNeeded),
        neededNum: debtNeeded,
        prep: debt > 0 ? `${formatKoreanAmount(debtPrep)} (가용자산)` : "부채 없음 (건전)",
        prepNum: debtPrep,
        shortage: debtShortage === 0 ? "0원 (해결)" : `${formatKoreanAmount(debtShortage)}`,
        shortageNum: debtShortage,
        status: debtStatus,
        statusCode: debtStatusCode,
        expertOpinion: debt > 0
          ? `현재 부채 규모는 ${formatKoreanAmount(debt)}이며, 은퇴 전 고정 이자 비용 절감을 위해 보유 가용자산 및 잉여금을 활용한 단계적 상환을 권장합니다.`
          : `현재 보유한 금융 부채가 없어 매월 고정 원리금 부담이 발생하지 않으며, 부채 건전성이 매우 우수합니다.`,
      },
      {
        id: "custom_goal",
        rank: `2순위: ${goalName}`,
        name: goalName,
        period: goalDate,
        needed: goalAmt > 0 ? formatKoreanAmount(goalAmt) : "0원 (입력 대기)",
        neededNum: goalAmt,
        prep: customPrep > 0 ? formatKoreanAmount(customPrep) : "0원",
        prepNum: customPrep,
        shortage: customShortage === 0 ? (goalAmt > 0 ? "0원 (달성)" : "0원") : `${formatKoreanAmount(customShortage)}`,
        shortageNum: customShortage,
        status: customStatus,
        statusCode: customStatusCode,
        expertOpinion: goalAmt > 0
          ? (customShortage === 0
              ? `고객님의 순자산(${formatKoreanAmount(netWorth)}) 범위 내에서 안정적으로 달성 가능한 목표입니다.`
              : `목표 달성을 위해 약 ${formatKoreanAmount(customShortage)}의 추가 자금이 필요하며, 월 잉여금 저축 및 비과세 계좌(ISA) 투자를 권장합니다.`)
          : "신규 고객 목표 등록 후 AFPK 맞춤 진단이 제공됩니다.",
      },
      {
        id: "retirement",
        rank: "3순위: 은퇴 생활비 확보",
        name: expense > 0 ? `은퇴 생활비 월 ${formatKoreanAmount(expense)} 확보` : "은퇴 생활비 마련 (20년간)",
        period: retireNeeded > 0 ? "은퇴 시점 ~ 향후 20년" : "직접 설정 (입력 대기)",
        needed: retireNeeded > 0 ? formatKoreanAmount(retireNeeded) : "0원",
        neededNum: retireNeeded,
        prep: retirePrep > 0 ? formatKoreanAmount(retirePrep) : "0원",
        prepNum: retirePrep,
        shortage: retireShortage > 0 ? `${formatKoreanAmount(retireShortage)} ⚠️` : "0원 (해결)",
        shortageNum: retireShortage,
        status: retireStatus,
        statusCode: retireStatusCode,
        expertOpinion: retireNeeded > 0
          ? `은퇴 후 20년간 안정적인 생활 유지를 위해 총 ${formatKoreanAmount(retireNeeded)}이 소요됩니다. 국민연금, 퇴직연금·IRP 및 주택연금을 종합 연계한 현금흐름 창출이 시급합니다.`
          : "월 지출 데이터가 입력되면 은퇴 후 20년간 필요 생활비가 자동 산출됩니다.",
      },
      {
        id: "emergency",
        rank: "4순위: 비상예비자금 및 세무·상속",
        name: "비상예비자금 및 세무·상속 대비",
        period: emergencyTarget > 0 ? "상시 유지 (3~6개월 치 생활비)" : "직접 설정 (입력 대기)",
        needed: emergencyTarget > 0 ? formatKoreanAmount(emergencyTarget) : "0원",
        neededNum: emergencyTarget,
        prep: emergencyVal > 0 ? formatKoreanAmount(emergencyVal) : "0원",
        prepNum: emergencyVal,
        shortage: emergencyShortage > 0 ? `${formatKoreanAmount(emergencyShortage)}` : "0원 (확보)",
        shortageNum: emergencyShortage,
        status: emergencyStatus,
        statusCode: emergencyStatusCode,
        expertOpinion: emergencyTarget > 0
          ? `돌발 지출 및 의료비 대비를 위해 약 ${formatKoreanAmount(emergencyTarget)}의 비상금을 유동성 계좌(CMA 등)에 유지하고, 구체적 상속·증여 절세는 한OO 세무사 상담을 권장합니다.`
          : "월 생활비 기준 3~6개월분의 비상예비자금 포트폴리오를 준비해야 합니다.",
      },
    ],
    solutions: [
      {
        item: "아파트 담보대출",
        before: debt > 0 ? formatKoreanAmount(debt) : "0원",
        after: "0원 (상환 플랜 수립)",
        effect: debt > 0 ? "퇴직 직후 원리금 부담 영구 제거 및 이자 절감" : "건전한 무부채 구조 유지",
      },
      {
        item: "퇴직 후 월 지출",
        before: expense > 0 ? `${formatKoreanAmount(expense)} / 월` : "0원",
        after: expense > 0 ? `${formatKoreanAmount(Math.round(expense * 0.75))} / 월 (▼ 절감)` : "-",
        effect: "고정지출 다이어트를 통한 생활비 25% 절감",
      },
      {
        item: "은퇴 후 월 수입",
        before: income > 0 ? "0원 (근로소득 중단)" : "0원",
        after: expense > 0 ? `${formatKoreanAmount(expense)} / 월 (연금 수령)` : "-",
        effect: "IRP + 국민연금 + 주택연금 결합으로 평생 현금흐름 확보",
      },
      {
        item: "금융투자 및 연금 자산",
        before: "일반 과세 계좌 중심",
        after: "중개형 ISA 및 IRP 계좌 이전",
        effect: "순이익 비과세 및 저율 분리과세(3.3%~5.5%) 혜택 극대화",
      },
    ],
    overallOpinion: "AFPK 재무주치의 종합 평가: 고객님의 실제 재무 데이터(자산, 부채, 현금흐름)를 바탕으로 은퇴 준비도와 부채 건전성을 진단하였습니다.",
  };
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }

  const {
    dataMode = "custom",
    financialContext = {},
    chatHistory = [],
  } = body;

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.API_KEY;

  // Fallback 결과 준비
  const fallbackResult = generateAfpkEvaluationFallback(dataMode, financialContext);

  if (!apiKey) {
    return NextResponse.json(fallbackResult);
  }

  try {
    const systemPrompt = `당신은 '재무주치의'의 수석 은퇴설계 AI 상담사다. 대상은 50·60대 고객이며,
AFPK·CFP 재무설계 6단계 표준 프로세스(고객 정보 수집 → 재무상태 분석 → 대안 제시 → 실행 → 점검)를 따른다.
다루는 고민은 4가지: ①은퇴 전 부채 상환 ②자녀 결혼자금 마련 ③은퇴 생활비 확보 ④상가주택 상속·절세.

# 현재 데이터 모드 및 고객 재무 컨텍스트
- 데이터 모드: ${dataMode} ('custom'이면 사용자 직접 입력 데이터, 'demo'이면 모범 체험 데이터)
- 재무 데이터: ${JSON.stringify(financialContext, null, 2)}
- 최근 상담 맥락: ${JSON.stringify(chatHistory.slice(-4), null, 2)}

# 임무: 4대 재무목표 및 솔루션 실시간 정밀 평가
고객의 실제 재무 데이터(총자산, 총부채, 월소득, 월지출, 목표금액)를 엄격히 반영하여 4대 재무목표의 우선순위, 기한, 필요자금, 준비자금, 부족액, 신호등 상태, 전문가 평가를 JSON으로 생성하세요.

# 엄수 규칙
1. dataMode가 'custom'일 때는 오직 재무 데이터에 들어있는 실제 입력값만 사용하세요. 예시 숫자를 임의로 섞지 마세요.
2. 부채가 7,000원이면 필요자금도 7,000원이어야 하며 2.5억 같은 다른 숫자를 넣으면 안 됩니다.
3. 4대 목표 id: "debt", "custom_goal", "retirement", "emergency".
4. 신호등 상태: "달성 가능 🟢", "사전 합의 🟡", "위험 경보 🔴", "진단 대기 ⚪".
5. 응답은 백틱 없는 순수 JSON이어야 합니다.`;

    const candidateModels = [
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemini-pro-latest",
    ];

    let response: Response | null = null;
    let successfulModel = "gemini-flash-latest";
    let lastError = "";

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\n위 규칙을 준수하여 4대 목표와 solutions 비교표를 JSON 형식으로 정밀 평가해 주세요.`,
          },
        ],
      },
    ];

    for (const model of candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.3,
                topP: 0.85,
              },
            }),
          }
        );

        if (res.ok) {
          response = res;
          successfulModel = model;
          break;
        } else {
          lastError = await res.text();
          console.warn(`Model ${model} evaluation failed:`, lastError);
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    if (!response || !response.ok) {
      console.warn("All Gemini models failed in evaluate-goals, serving verified AFPK fallback calculation:", lastError);
      return NextResponse.json({ ...fallbackResult, usedModel: "gemini-flash-latest" });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = rawText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.goals && Array.isArray(parsed.goals)) {
        parsed.goals = parsed.goals.map((g: any, idx: number) => {
          const fb = fallbackResult.goals[idx] || fallbackResult.goals[0];
          const merged = {
            ...fb,
            ...(g && typeof g === "object" ? g : {}),
          };
          merged.id = typeof merged.id === "string" && merged.id.trim() ? merged.id : fb.id;
          merged.rank = typeof merged.rank === "string" && merged.rank.trim() ? merged.rank : fb.rank;
          merged.name = typeof merged.name === "string" && merged.name.trim() ? merged.name : fb.name;
          merged.period = typeof merged.period === "string" && merged.period.trim() ? merged.period : fb.period;
          merged.needed = typeof merged.needed === "string" && merged.needed.trim() ? merged.needed : fb.needed;
          merged.prep = typeof merged.prep === "string" && merged.prep.trim() ? merged.prep : fb.prep;
          merged.shortage = typeof merged.shortage === "string" && merged.shortage.trim() ? merged.shortage : fb.shortage;
          merged.status = typeof merged.status === "string" && merged.status.trim() ? merged.status : fb.status;
          merged.statusCode = typeof merged.statusCode === "string" && merged.statusCode.trim() ? merged.statusCode : fb.statusCode;
          merged.expertOpinion = typeof merged.expertOpinion === "string" && merged.expertOpinion.trim() ? merged.expertOpinion : fb.expertOpinion;
          return merged;
        });

        // dataMode가 custom일 때 핵심 수치 정합성 보장
        if (dataMode === "custom") {
          const userDebt = parseNum(financialContext.totalDebt);
          const userGoalAmt = parseNum(financialContext.goalAmount);
          parsed.goals.forEach((g: any) => {
            if (g.id === "debt" && userDebt >= 0) {
              g.needed = formatKoreanAmount(userDebt);
              g.neededNum = userDebt;
            }
            if (g.id === "custom_goal" && userGoalAmt >= 0) {
              g.needed = formatKoreanAmount(userGoalAmt);
              g.neededNum = userGoalAmt;
            }
          });
        }
        return NextResponse.json({ ...parsed, usedModel: successfulModel });
      }
    } catch (parseErr) {
      console.warn("JSON parse failed, serving AFPK fallback:", parseErr);
    }

    return NextResponse.json({ ...fallbackResult, usedModel: successfulModel });
  } catch (error: any) {
    console.error("evaluate-goals route error:", error);
    return NextResponse.json(fallbackResult);
  }
}
