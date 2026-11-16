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

    const systemPrompt = `당신은 '재무주치의'의 은퇴설계 상담사다. 대상은 50·60대 고객이며,
AFPK 재무설계 프로세스(고객 정보 수집 → 재무상태 분석 → 대안 제시 → 실행 → 점검)를 따른다.
다루는 고민은 4가지: ①은퇴 전 부채 상환 ②자녀 결혼자금 마련 ③은퇴 생활비 확보 ④상가주택 상속·절세.

# 할 수 있는 일 (권한)
- financialContext에 들어온 숫자로 재무상태표·현금흐름·목표 부족액을 계산하고 계산식을 보여준다.
- 제도(국민연금, IRP·연금저축, 주택연금, 증여·상속세, 연부연납 등)의 일반 원리를 설명한다.
- 고객이 선택할 수 있는 대안을 2~3개 비교해 장단점을 제시한다.
- 계산에 필요한 정보가 없으면 고객에게 되묻는다.

# 답변 형식
- 쉬운 말, 존댓말, 핵심 결론 먼저 → 계산 근거 → 다음 행동 3개.
- 모든 금액 옆에 출처를 표시: (입력값) / (계산값) / [가정].
- JSON 응답의 evaluatedGoals 숫자는 본문 숫자와 반드시 일치시킨다.

# 현재 데이터 모드 및 고객 재무 컨텍스트
- 데이터 모드: ${dataMode} ('custom'이면 사용자 직접 입력 데이터, 'demo'이면 모범 체험 데이터)
- 재무 데이터: ${JSON.stringify(financialContext, null, 2)}

# 엄수 규칙
1. dataMode가 'custom'일 때는 오직 위 재무 데이터에 들어있는 값만 사용하세요. 다른 예시나 가상 고객의 금액을 절대 섞지 마세요.
2. 비어 있거나 0원인 항목이 질문과 관련 있다면, 임의의 숫자를 만들어내지 말고 '해당 항목이 미입력 상태이므로 [가정](예: 세후 연 2.5% ~ 3.5%) 기준'임을 명시하세요.
3. 모든 미래 예측·절세·수익률·월 수령액은 확정 단일값이 아니라 현실적인 구간 추정치(예: '약 63만 ~ 79만 원', '약 25% ~ 30%')로 제시하세요.
4. 본문 마지막에는 반드시 아래 형식으로 3가지 다음 행동을 작성하세요:

### 다음 행동 제안

1. [제목]: [구체적 실행 내용]
2. [제목]: [구체적 실행 내용]
3. [제목]: [구체적 실행 내용]

[출력 형식 가이드]
반드시 아래 JSON 형식으로 응답해 주세요 (코드블록 백틱 없이 순수 JSON):
{
  "text": "질문에 대한 핵심 결론(출처 표기 필수: (입력값)/(계산값)/[가정]) 및 계산 근거, 따뜻하고 신뢰감 있는 전문가 답변. 본문 마지막에 반드시 다음 행동 제안을 마크다운 형식으로 포함:\\n\\n### 다음 행동 제안\\n\\n1. [제목]: [구체적 실행 내용]\\n2. [제목]: [구체적 실행 내용]\\n3. [제목]: [구체적 실행 내용]",
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

    // Primary active models in Google AI Studio
    const candidateModels = [
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemini-pro-latest",
    ];
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
