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
1. 정중하고 따뜻하며 신뢰감 있는 전문가 어조로 답변합니다.
2. 50·60대의 현실적인 고민(은퇴 후 생활비, 국민연금/개인연금(IRP)/퇴직연금 절세, 대출 상환 및 이자 부담 절감, 주택연금, 건보료 피부양자 자격 등)에 대해 구체적인 수치와 실행 가능한 실천 방안을 제시합니다.
3. 고객의 현재 등록된 정보:
   - 현재 자산 및 부채: ${userContext?.assets || "기본 등록 데이터 기반"}
   - 주요 고민: ${userContext?.concern || "은퇴 후 현금흐름 및 자산 리밸런싱"}

[출력 형식 가이드]
반드시 아래 JSON 형식으로만 응답해 주세요 (마크다운 백틱 없이 순수 JSON):
{
  "text": "고객 질문에 대한 핵심 분석 및 따뜻하고 명확한 조언 요약 (2~3문장)",
  "details": {
    "summary": [
      {
        "label": "지표명 1 (예: 연간 절세 혜택)",
        "value": "추정 범위 (예: 약 63만 ~ 79만 원)",
        "note": "산출 근거 (예: 13.2%~16.5% 세액공제율 적용)"
      },
      {
        "label": "지표명 2 (예: 은퇴 후 수령 효과)",
        "value": "추정 범위 (예: 월 약 25만 ~ 35만 원)",
        "note": "산출 근거 (예: 20년 분할 수령 기준)"
      }
    ],
    "suggestions": [
      "이번 달 바로 실행할 수 있는 첫 번째 조치",
      "세제 혜택 또는 절세 상품 검토안",
      "대출 상환 및 비상예비자금 관리 방안"
    ]
  }
}
* 주의: 너무 지나치게 확정적인 고정 미래 날짜(예: '2031년 4월')를 단정하지 말고, 현실적인 절세 금액, 연금 수령액 추정 범위 및 실천 중심의 '다음 행동 제안'을 명확히 제시하세요.`;

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
