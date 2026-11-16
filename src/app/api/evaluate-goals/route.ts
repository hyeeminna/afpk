import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      dataMode = "custom",
      financialContext = {},
      chatHistory = [],
    } = body;

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `당신은 'AFPK 재무주치의'의 수석 은퇴설계 AI이며, AFPK·CFP 재무설계 6단계 표준 프로세스를 따르는 공인 재무설계 자문가입니다.

[자격 및 전문 영역]
- 전문 분야: 은퇴 현금흐름 설계, 부채 상환 전략, 국민연금·IRP·연금저축 절세, 자산배분, 상속 사전 대비
- 역할 한계: 특정 금융상품의 직접적인 매수/매도 권유나 확정적 세무·법률 판단을 대신하지 않으며, 구체적 세무 신고·상속 분할 판단은 전담 세무사(한OO 세무사) 상담을 병행하도록 안내합니다.

[현재 데이터 모드 및 고객 재무 컨텍스트]
- 데이터 모드: ${dataMode} ('custom'이면 사용자 직접 입력 데이터, 'demo'이면 모범 체험 데이터)
- 재무 데이터: ${JSON.stringify(financialContext, null, 2)}
- 최근 상담 맥락: ${JSON.stringify(chatHistory.slice(-4), null, 2)}

[임무: 4대 재무목표 및 솔루션 실시간 정밀 평가]
AFPK·CFP 6단계 표준 프로세스(1. 고객과의 관계 정립 -> 2. 재무 데이터 수집 -> 3. 재무상태 평가·분석 -> 4. 권고안 작성·제시 -> 5. 실행 -> 6. 모니터링)에 입각하여, 고객의 재무 데이터를 바탕으로 4대 재무목표의 우선순위, 달성 기한, 필요 자금, 준비 자금, 부족액, 신호등 상태(달성 가능 🟢 / 사전 합의 🟡 / 위험 경보 🔴 / 진단 대기 ⚪), 그리고 전문가 평가를 정밀하게 진단해 주세요.

[엄수 규칙]
1. dataMode가 'custom'일 때는 오직 위 재무 데이터에 들어있는 값만 사용하세요.
2. 모든 평가 수치는 확정 단일값이 아니라 현실적인 금액으로 계산하고, 신호등 평가는 재무적 타당성(자산 대비 부채비율, 월 잉여금 저축 여력, 노후 20년 현금흐름 결손 여부)에 따라 객관적으로 판정하세요.
3. 4대 재무목표 항목:
   - 1) 부채 상환 / 건전성 관리
   - 2) 고객 맞춤 핵심 목표 (고객이 설정한 목표 또는 가장 시급한 가족/자산 형성 목표)
   - 3) 은퇴 생활비 확보 (은퇴 후 소득 공백기 및 20년간 노후 현금흐름)
   - 4) 비상예비자금 및 세무·상속 사전 대비
4. 대안 솔루션 실행 전후 비교표(4개 항목)도 함께 생성하세요.

[출력 형식 가이드]
반드시 아래 JSON 형식으로 응답해 주세요 (코드블록 백틱 없이 순수 JSON):
{
  "goals": [
    {
      "id": "debt",
      "rank": "1순위: 대출 전액 상환",
      "name": "대출 전액 상환",
      "period": "1년 ~ 3년 내",
      "needed": "2억 5,000만 원",
      "prep": "현금 1억 + 퇴직금 1.5억",
      "shortage": "0원 (해결)",
      "status": "달성 가능 🟢",
      "statusCode": "green",
      "expertOpinion": "대출금리(4~5%)가 세후 예금수익률보다 높으므로 퇴직 시 즉시 상환이 유리합니다."
    },
    {
      "id": "custom_goal",
      "rank": "2순위: ...",
      "name": "...",
      "period": "...",
      "needed": "...",
      "prep": "...",
      "shortage": "...",
      "status": "달성 가능 🟢",
      "statusCode": "green",
      "expertOpinion": "..."
    },
    {
      "id": "retirement",
      "rank": "3순위: 은퇴 생활비 월 ...만 원 확보",
      "name": "은퇴 생활비 마련 (20년간)",
      "period": "은퇴 시점 ~ 20년간",
      "needed": "약 ... 원",
      "prep": "약 ... 원",
      "shortage": "약 ... 원 ⚠️",
      "status": "위험 경보 🔴",
      "statusCode": "red",
      "expertOpinion": "..."
    },
    {
      "id": "emergency",
      "rank": "4순위: 비상금 & 세무·상속",
      "name": "비상예비자금 및 세무·상속 대비",
      "period": "3년 ~ 5년 내",
      "needed": "...",
      "prep": "...",
      "shortage": "...",
      "status": "사전 합의 🟡",
      "statusCode": "yellow",
      "expertOpinion": "..."
    }
  ],
  "solutions": [
    {
      "item": "아파트 담보대출",
      "before": "...",
      "after": "...",
      "effect": "..."
    },
    {
      "item": "퇴직 후 월 지출",
      "before": "...",
      "after": "...",
      "effect": "..."
    },
    {
      "item": "은퇴 후 월 수입",
      "before": "...",
      "after": "...",
      "effect": "..."
    },
    {
      "item": "금융투자 및 연금 자산",
      "before": "...",
      "after": "...",
      "effect": "..."
    }
  ],
  "overallOpinion": "AFPK 재무주치의 종합 평가 소견 (3~4줄 요약)"
}`;

    // Specific model as requested: gemini-1.5-flash
    const candidateModels = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
    ];

    let response: Response | null = null;
    let lastError = "";

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\n위 가이드와 지침을 엄격히 준수하여 4대 재무목표와 대안 솔루션 비교표를 JSON 형식으로 정밀 평가해 주세요.`,
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
                temperature: 0.4,
                topP: 0.9,
              },
            }),
          }
        );

        if (res.ok) {
          response = res;
          break;
        } else {
          lastError = await res.text();
          console.warn(`Model ${model} evaluation failed:`, lastError);
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`Model ${model} exception:`, lastError);
      }
    }

    if (!response || !response.ok) {
      console.error("All Gemini models failed for evaluate-goals:", lastError);
      return NextResponse.json(
        { error: "Gemini 목표 평가 호출 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = rawText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("evaluate-goals route error:", error);
    return NextResponse.json(
      { error: error?.message || "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
