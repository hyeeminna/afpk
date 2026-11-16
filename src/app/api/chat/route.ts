import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userContext, dataMode: reqDataMode, financialContext: reqFinancialContext } = body;

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

    const dataMode = reqDataMode || (userContext?.isCustomUser ? "custom" : "demo");
    const financialContext = reqFinancialContext || userContext || {};

    const systemPrompt = `당신은 'AFPK 재무주치의'의 수석 은퇴설계 AI이며, AFPK·CFP 재무설계 6단계 표준 프로세스를 따르는 공인 재무설계 자문가입니다.

[자격 및 전문 영역]

- 전문 분야: 은퇴 현금흐름 설계, 부채 상환 전략, 국민연금·IRP·연금저축 절세, 자산배분, 상속 사전 대비
- 역할 한계: 특정 금융상품의 직접적인 매수/매도 권유나 확정적 세무·법률 판단을 대신하지 않으며, 구체적 세무 신고·상속 분할 판단은 전담 세무사(한OO 세무사) 상담을 병행하도록 안내합니다.

[현재 데이터 모드 및 고객 재무 컨텍스트]

- 데이터 모드: ${dataMode} ('custom'이면 사용자 직접 입력 데이터, 'demo'이면 모범 체험 데이터)
- 재무 데이터: ${JSON.stringify(financialContext, null, 2)}

[엄수 규칙]

1. dataMode가 'custom'일 때는 오직 위 재무 데이터에 들어있는 값만 사용하세요. 다른 예시나 가상 고객의 금액을 절대 섞지 마세요.
2. 비어 있거나 0원인 항목이 질문과 관련 있다면, 임의의 숫자를 만들어내지 말고 '해당 항목이 미입력 상태이므로 일반적 가정(예: 세후 연 2.5% ~ 3.5%) 기준'임을 명시하세요.
3. 모든 미래 예측·절세·수익률·월 수령액은 확정 단일값이 아니라 반드시 구간 추정치(예: '약 63만 ~ 79만 원', '약 25% ~ 30%')로 제시하세요.
4. 답변 마지막에는 반드시 아래 형식으로 실행 가능한 3가지 다음 행동을 작성하세요.

### 다음 행동 제안

1. [제목]: [구체적 실행 내용]
2. [제목]: [구체적 실행 내용]
3. [제목]: [구체적 실행 내용]

[출력 형식 가이드]
반드시 아래 JSON 형식으로 응답해 주세요 (코드블록 백틱 없이 순수 JSON):
{
  "text": "질문에 대한 핵심 분석 및 따뜻하고 신뢰감 있는 전문가 답변 (구간 추정치 필수 반영). 본문 마지막에 반드시 다음 행동 제안을 마크다운 형식으로 포함:\\n\\n### 다음 행동 제안\\n\\n1. [제목]: [구체적 실행 내용]\\n2. [제목]: [구체적 실행 내용]\\n3. [제목]: [구체적 실행 내용]",
  "details": {
    "summary": [
      {
        "label": "핵심 지표 1 (예: 예상 절세 혜택)",
        "value": "구간 추정치 (예: 약 63만 ~ 79만 원)",
        "note": "산출 근거 (예: 세액공제 13.2%~16.5% 적용)"
      },
      {
        "label": "핵심 지표 2 (예: 월 권장 저축액)",
        "value": "구간 추정치 (예: 약 40만 ~ 50만 원)",
        "note": "산출 근거 (예: 목표 시점 달성 기준)"
      }
    ],
    "suggestions": [
      "[제목]: [구체적 실행 내용]",
      "[제목]: [구체적 실행 내용]",
      "[제목]: [구체적 실행 내용]"
    ],
    "evaluatedGoals": [
      {
        "id": "debt",
        "rank": "1순위: ...",
        "name": "...",
        "period": "...",
        "needed": "...",
        "prep": "...",
        "shortage": "...",
        "status": "달성 가능 🟢" ,
        "statusCode": "green",
        "expertOpinion": "..."
      }
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
            text: "안녕하세요, 공인 재무설계 자문가 'AFPK 재무주치의' 수석 은퇴설계 AI입니다. 고객님의 재무 데이터와 은퇴 목표를 바탕으로 최적의 솔루션을 안내해 드리겠습니다.\n\n### 다음 행동 제안\n\n1. [재무 목표 정밀 점검]: 현재 설정된 목표 자금과 달성 시점의 적절성 검토\n2. [비상예비자금 확보]: 필수 지출 3~6개월분의 안전자산 비축\n3. [절세 연금 계좌 활용]: IRP 및 연금저축을 통한 세액공제 극대화",
            details: {
              summary: [
                {
                  label: "상담 프로세스",
                  value: "AFPK 6단계 표준",
                  note: "공인 재무설계 표준 가이드 준수"
                }
              ],
              suggestions: [
                "[재무 목표 정밀 점검]: 현재 설정된 목표 자금과 달성 시점의 적절성 검토",
                "[비상예비자금 확보]: 필수 지출 3~6개월분의 안전자산 비축",
                "[절세 연금 계좌 활용]: IRP 및 연금저축을 통한 세액공제 극대화"
              ],
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

    // Primary model as requested: gemini-1.5-flash
    const candidateModels = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash-lite"];
    let response: Response | null = null;
    let lastErrorText = "";

    for (const modelName of candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
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

        if (res.ok) {
          response = res;
          break;
        } else {
          lastErrorText = await res.text();
          console.warn(`Model ${modelName} returned status ${res.status}:`, lastErrorText);
        }
      } catch (fetchErr: any) {
        lastErrorText = fetchErr?.message || String(fetchErr);
        console.warn(`Model ${modelName} fetch exception:`, lastErrorText);
      }
    }

    if (!response || !response.ok) {
      console.error("All Gemini candidate models failed. Last error:", lastErrorText);
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
      // Fallback: extract suggestions if markdown ### 다음 행동 제안 present
      const suggestions: string[] = [];
      const lines = rawText.split("\n");
      let capture = false;
      for (const line of lines) {
        if (line.includes("### 다음 행동 제안")) {
          capture = true;
          continue;
        }
        if (capture && /^[0-9]\.\s/.test(line.trim())) {
          suggestions.push(line.replace(/^[0-9]\.\s*/, "").trim());
        }
      }

      parsedData = {
        text: rawText,
        details: {
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        },
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
