import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, userContext } = await req.json();

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

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
  "text": "고객 질문에 대한 핵심 분석 및 따뜻하고 명확한 조언 요약 (2~4문장)",
  "details": {
    "basis": [
      "계산 근거 또는 전제 조건 1",
      "계산 근거 또는 전제 조건 2"
    ],
    "comparison": [
      {
        "plan": "현재 유지",
        "saving": "기존 유지 시 예상치",
        "date": "도달 시점 또는 유지 결과",
        "reduction": "위험 요인 또는 한계점"
      },
      {
        "plan": "개선 제안 플랜",
        "saving": "조정 금액 또는 절세액",
        "date": "개선 달성 시점",
        "reduction": "✓ 기대 효과 및 절감액"
      }
    ],
    "suggestions": [
      "이번 달 실천할 첫 번째 조치",
      "세제 혜택 또는 절세 상품 검토안",
      "장기적인 자산 안전망 확보 방안"
    ]
  }
}`;

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
