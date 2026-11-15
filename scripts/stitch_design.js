const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const srcDir = "/Users/hyemin/.gemini/antigravity/brain/3871069d-daf2-48f5-9e62-3f0a2dfdf78d/browser_sandbox/screenshots";
const destDir = "/Users/hyemin/Desktop/afpk_ai/docs/design_screens";
fs.mkdirSync(destDir, { recursive: true });

const screens = [
  { file: "step_2_shot_1_01_home.png", name: "01_home.png", title: "01. 홈 메인 (Hero 배너 및 4대 은퇴 고민 선택)" },
  { file: "step_4_shot_1_02_step1.png", name: "02_step1.png", title: "02. STEP 01 재무설계안 등록 (계산기 콤마 및 실시간 요약)" },
  { file: "step_6_shot_1_03_step2.png", name: "03_step2.png", title: "03. STEP 02 월별 변동 입력 (9월 vs 10월 MoM 비교 및 차트)" },
  { file: "step_8_shot_1_04_step3_ai_chat.png", name: "04_step3_ai_chat.png", title: "04. STEP 03 Gemini AI 재무상담 (추천 질문 칩 및 3대 제안)" },
  { file: "step_10_shot_1_05_financial_status.png", name: "05_financial_status.png", title: "05. 내 재무현황 종합 분석표 (상세 재무상태표 및 현금흐름표)" },
  { file: "step_12_shot_1_06_goals.png", name: "06_goals.png", title: "06. 재무목표 관리 (4대 재무목표 신호등 카드 및 솔루션)" },
  { file: "step_14_shot_1_07_report.png", name: "07_report.png", title: "07. 공인 은퇴설계 종합 진단 리포트 (ARPK 재무주치의)" },
  { file: "step_16_shot_1_08_settings.png", name: "08_settings.png", title: "08. 환경설정 및 데이터 관리 (Supabase 연동 및 공란 리셋)" },
  { file: "step_18_shot_1_09_tax_modal.png", name: "09_tax_modal.png", title: "09. 한OO 세무사 1:1 상담 QR 모달 (카카오톡 연동)" },
];

async function run() {
  console.log("Copying individual screenshots...");
  for (const s of screens) {
    fs.copyFileSync(path.join(srcDir, s.file), path.join(destDir, s.name));
  }
  console.log("Copied 9 screens to", destDir);

  const thumbW = 1200;
  const thumbH = 792;
  const paddingX = 60;
  const cardSpacingY = 80;
  const headerH = 220;
  const cols = 3;
  const rows = 3;

  const totalW = cols * thumbW + (cols + 1) * paddingX; // 3840 (4K width)
  const totalH = headerH + rows * (thumbH + cardSpacingY) + paddingX;

  console.log(`Canvas size: ${totalW}x${totalH}`);

  const composites = [];

  // 1. Top Header SVG
  const headerSvg = `
    <svg width="${totalW}" height="${headerH}">
      <rect width="${totalW}" height="${headerH}" fill="#070E22"/>
      <rect x="0" y="${headerH - 2}" width="${totalW}" height="2" fill="#1E3A8A"/>
      <text x="${paddingX}" y="85" font-family="-apple-system, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" letter-spacing="-1">
        재무주치의 (AFPK 공인 은퇴설계 AI) - 전체 화면 디자인 시스템 아카이브
      </text>
      <text x="${paddingX}" y="135" font-family="-apple-system, sans-serif" font-size="22" font-weight="600" fill="#93C5FD">
        다른 로컬 환경 개발 및 디자인 복제를 위한 9대 핵심 화면 4K 통합 고해상도 규격 명세 (localhost:3000)
      </text>
      <text x="${paddingX}" y="175" font-family="-apple-system, sans-serif" font-size="16" font-weight="500" fill="#64748B">
        스택: Next.js 16 (App Router) • React 19 • Tailwind CSS 4 • Supabase Cloud • Google Gemini 2.5 Flash • 한OO 세무사 카카오 상담
      </text>
    </svg>
  `;
  composites.push({
    input: Buffer.from(headerSvg),
    top: 0,
    left: 0,
  });

  // 2. Add each card
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const c = i % cols;
    const r = Math.floor(i / cols);

    const x = paddingX + c * (thumbW + paddingX);
    const y = headerH + 30 + r * (thumbH + cardSpacingY);

    // Title label bar above image
    const titleSvg = `
      <svg width="${thumbW}" height="40">
        <rect width="${thumbW}" height="36" rx="8" fill="#131F37"/>
        <circle cx="20" cy="18" r="5" fill="#3B82F6"/>
        <text x="35" y="24" font-family="-apple-system, sans-serif" font-size="16" font-weight="bold" fill="#F8FAFC">
          ${s.title}
        </text>
      </svg>
    `;
    composites.push({
      input: Buffer.from(titleSvg),
      top: y,
      left: x,
    });

    // Resized screenshot
    const resizedThumb = await sharp(path.join(srcDir, s.file))
      .resize(thumbW, thumbH, { fit: "contain", background: "#0B1329" })
      .toBuffer();

    composites.push({
      input: resizedThumb,
      top: y + 42,
      left: x,
    });
  }

  console.log("Stitching design.png...");
  await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 11, g: 19, b: 41, alpha: 1 }, // #0B1329
    },
  })
    .composite(composites)
    .png({ quality: 95 })
    .toFile("/Users/hyemin/Desktop/afpk_ai/design.png");

  // Also copy to root alias if present
  try {
    fs.copyFileSync("/Users/hyemin/Desktop/afpk_ai/design.png", "/Users/hyemin/Desktop/AFPK 재무설계 AI/design.png");
  } catch (e) {
    // ignore
  }

  console.log("SUCCESS! design.png created at /Users/hyemin/Desktop/afpk_ai/design.png");
}

run().catch(console.error);
