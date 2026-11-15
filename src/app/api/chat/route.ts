import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, userContext } = await req.json();

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

    const systemPrompt = `당신은 대한민국 50·60대 은퇴 및 노후 자산 설계를 돕는 공인재무설계사(AFPK) 기반의 '재무주치의' AI입니다.

[역할 및 지침]
1. 정중하고 따뜻하며 신뢰감 있는 최고 수준의 재무설계 전문가 어조로 답변합니다.
2. ★핵심 지침: 고객이 설정한 최우선 재무 목표 [${userContext?.goal || "은퇴 후 생활비 마련"}] (목표 금액: ${userContext?.goalAmount || "미지정"}, 목표 시점: ${userContext?.goalDate || "은퇴 시점"})를 모든 상담과 분석의 절대적인 중심에 두고 답변하십시오.
3. ★고객의 실제 재무 데이터(STEP 01 및 STEP 02) 절대 최우선 반영:
   - 최우선 목표: ${userContext?.goal || "은퇴 후 생활비 마련"} (목표 금액: ${userContext?.goalAmount || "미지정"}, 기한: ${userContext?.goalDate || "은퇴 시점"})
   - 고객 자산 현황: ${userContext?.assets || "기본 등록 데이터"}
   - 고객 현금흐름 현황: ${userContext?.cashflow || "월 잉여금 기반"}
   - 퇴직 직후 예상 월 수치: ${userContext?.retirementDeficit || "적자 발생 위험"} (소득 단절 시 월 지출 기준 적자액)
   - 비상예비자금 보유 수준: 약 ${userContext?.emergencyMonths || "0"}개월분
   - STEP 02 월별 실데이터: 10월(소득 ${userContext?.step2Monthly?.rec10?.income || "0"}원, 고정 ${userContext?.step2Monthly?.rec10?.fixedExpense || "0"}원, 변동 ${userContext?.step2Monthly?.rec10?.variableExpense || "0"}원, 투자 ${userContext?.step2Monthly?.rec10?.investment || "0"}원, 부채변동 ${userContext?.step2Monthly?.rec10?.debtChange || "0"}원) / 9월(소득 ${userContext?.step2Monthly?.rec9?.income || "0"}원, 지출 ${userContext?.step2Monthly?.rec9?.fixedExpense || "0"}원)
   - 주요 고민: ${userContext?.concern || userContext?.goal || "목표 달성 및 현금흐름 최적화"}
   ${userContext?.isCustomUser ? "★주의: 고객이 직접 입력한 맞춤 수치(월 소득, 지출, 잉여금, 부채)를 정확히 인용하여 분석하고, 가상 모범안의 72만원, 17억원 등의 고정값을 임의로 언급하지 마십시오." : ""}
4. 고객의 질문이 일반 금융 상식, 세법(상속·증여세, 소득세, 배당세), 부동산(주택연금, LTV), 은퇴연금(국민연금, 퇴직연금 IRP, 연금저축) 등에 대한 것이더라도 해당 금융 지식을 명쾌하고 정확하게 설명한 후, 궁극적으로 고객의 핵심 목표인 [${userContext?.goal || "재무 목표"}] 달성에 미치는 영향과 실천 솔루션을 구체적으로 연결하여 답변하세요.

[출력 형식 가이드]
반드시 아래 JSON 형식으로만 응답해 주세요 (마크다운 백틱 없이 순수 JSON):
{
  "text": "고객 목표 달성과 질문에 대한 핵심 분석 및 따뜻하고 명확한 조언 요약 (2~3문장)",
  "details": {
    "summary": [
      {
        "label": "지표명 1 (예: 고객 월 잉여금 기반 세액공제 효과)",
        "value": "추정 범위 (예: 연간 약 63만 ~ 79만 원 절세)",
        "note": "산출 근거 (예: 13.2%~16.5% 세액공제율 적용)"
      },
      {
        "label": "지표명 2 (예: 월 적정 저축/투자액)",
        "value": "추정 범위 (예: 월 약 40만 ~ 50만 원)",
        "note": "산출 근거 (예: 목표 시점 달성 기준)"
      }
    ],
    "suggestions": [
      "이번 달 바로 실행할 수 있는 첫 번째 조치",
      "목표 달성을 위한 세제 혜택 또는 절세 상품 검토안",
      "부채 상환 및 비상예비자금 조율 방안"
    ]
  }
}
* 주의: 너무 지나치게 확정적인 고정 미래 날짜를 단정하지 말고, 고객의 실제 입력 수치에 부합하는 현실적인 절세 금액, 연금 수령액 추정 범위 및 실천 중심의 '다음 행동 제안'을 명확히 제시하세요.`;

    // Format chat history for Gemini API
    const contents: any[] = [];

    // System instruction as first user message or system instruction
    contents.push({
      role: "user",
      parts: [{ text: `${systemPrompt}\n\n위 지침에 따라 아래 사용자의 질문에 답해주세요.` }],
    });
    contents.push({
      role: "model",
      parts: [
        {
          text: JSON.stringify({
            text: "안녕하세요, 고객님의 든든한 은퇴 재무주치의입니다. 현재 자산 현황과 은퇴 목표를 바탕으로 최적의 솔루션을 안내해 드리겠습니다.",
            details: {
              basis: ["등록된 기본 재무 진단 데이터 적용"],
              comparison: [],
              suggestions: ["궁금하신 점을 편하게 질문해 주세요."],
            },
          }),
        },
      ],
    });

    // Append past messages
    if (Array.isArray(messages)) {
      messages.slice(-6).forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text || "" }],
        });
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: "Gemini API 호출 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean JSON formatting if wrapped in markdown
    let parsedData: any = null;
    try {
      const cleaned = rawText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedData = JSON.parse(cleaned);
    } catch {
      parsedData = {
        text: rawText,
      };
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error?.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
