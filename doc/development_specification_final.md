# 재무주치의 (AFPK 재무주치의) 최종 통합 개발 명세서

> **문서 버전:** v2.0.0 (Final)  
> **최종 수정일:** 2026-11-16  
> **기반 저장소:** `https://github.com/hyeeminna/afpk.git` (`main` 브랜치)  
> **작성 목적:** 프로젝트 초기 생성부터 최종 기능 통합·버그 수정까지 사용자가 요청한 **모든 요구사항 히스토리(Phase 1 ~ Phase 12)** 와 최종 코드베이스 기준 **화면·로직·AI 프롬프트·디자인·DB·환경설정 명세**를 단일 정본 문서로 집대성함.

---

## 목차
1. [프로젝트 개요 및 기술 스택](#1-프로젝트-개요-및-기술-스택)
2. [사용자 요청 전수 수록 (Phase 1 ~ Phase 12)](#2-사용자-요청-전수-수록-phase-1--phase-12)
3. [화면별 최종 상세 기능 및 UI/UX 구현 명세](#3-화면별-최종-상세-기능-및-uiux-구현-명세)
4. [AI 상담사 페르소나 · 모델 연동 · 목표 정밀 평가 명세](#4-ai-상담사-페르소나--모델-연동--목표-정밀-평가-명세)
5. [디자인 시스템 및 스타일 가이드](#5-디자인-시스템-및-스타일-가이드)
6. [데이터베이스 스키마 및 보안 규칙 (Supabase & RLS)](#6-데이터베이스-스키마-및-보안-규칙-supabase--rls)
7. [프로젝트 파일 구조 및 로컬 복제 실행 가이드](#7-프로젝트-파일-구조-및-로컬-복제-실행-가이드)

---

## 1. 프로젝트 개요 및 기술 스택

### 1.1 서비스 정의
* **서비스명:** 재무주치의 (`AFPK 재무주치의`) — 50·60대를 위한 은퇴 준비 무료 점검 플랫폼
* **브라우저 타이틀 / 메타 설명 (`src/app/layout.tsx`):**
  * Title: `재무주치의 - 50·60대를 위한 은퇴 준비 무료 점검`
  * Description: `나의 재무상태, 이대로 괜찮을까요? 은퇴 후 생활비, 연금, 대출, 노후자금 점검을 위한 든든한 맞춤형 재무주치의`
* **최종 대시보드 5단계 워크플로우 (`src/app/diagnosis/page.tsx`):**
  1. `STEP 01 설계안 등록` (총 자산·총 부채·월 소득/지출·비상자금·핵심 재무목표 실시간 입력 및 계산 요약)
  2. `STEP 02 월별 변동 입력` (2026년 9월 vs 10월 독립 실적 저장 및 월별 입력)
  3. `STEP 03 AI 재무상담` (4대 고객 유형별 맞춤 질문 5종 랜덤 초기질문·추천가이드 및 Google Gemini 기반 실시간 상담 + 목표 정밀 진단 실행)
  4. `내 재무현황` (`FinancialStatusView.tsx` — 재무상태표, 퇴직 전후 월간 현금흐름표, 퇴직 직후 월 수치 실시간 연산, 자산·보험·세무 정밀 진단 및 작성 기준일/세부 항목 직접 편집)
  5. `리포트` (`ReportView.tsx` — 종합 진단서, `3. 재무목표 상세 및 순위·기한·금액 진단` 실 구동 Gemini 모델 결과 및 STEP 01~03 데이터 실시간 연동, 리포트 세부 항목 작성/수정 모달)
  > ※ 리포트 3번 섹션과 기능이 중복되던 **`목표 관리` 탭** 및 **사이드바 `설정` 탭**은 사용자 요청에 따라 최종 버전에서 완전히 제거되었습니다.

### 1.2 기술 스택 (`package.json` & `next.config.ts`)
* **Framework:** `next` `16.4.6` (App Router, Turbopack, `cacheComponents: true`, `partialPrefetching: true`)
* **UI Runtime:** `react` `19.3.0`, `react-dom` `19.3.0`, `typescript` `^5`
* **Styling & UI:** `tailwindcss` `4.3.3`, `@tailwindcss/turbopack` `4.3.3`, `tw-animate-css` `^1.4.0`, `shadcn` `^4.23.0`, `@base-ui/react` `^1.9.0`, `lucide-react` `^1.72.0`, Google Material Symbols Outlined
* **Theme:** `next-themes` `^0.4.6` (다크 모드 / 라이트 모드 전환 지원, 기본 `light`)
* **Database & Auth:** `@supabase/supabase-js` `^2.119.0`, `@supabase/ssr` `^0.12.7` (Supabase Cloud PostgreSQL + PostgREST + RLS + Google OAuth 2.0)
* **AI Engine:** Google Generative Language REST API (`v1beta/models/{model}:generateContent`)
  * 실제 호출 후보 모델 순서: `gemini-flash-latest` → `gemini-3.5-flash` → `gemini-3.8-flash` → `gemini-pro-latest`
  * 실제 응답 생성 모델명(`usedModel`)을 API 응답에 실어 UI 문구·버튼·리포트 표 헤더에 동적 표시
  * 외부 API 일시 장애(503/429 등) 시에도 HTTP 500 오류 대신 고객 입력 실데이터 기반 **AFPK 내장 수식 계산 Fallback** 자동 제공 (`src/app/api/evaluate-goals/route.ts`)
* **QR Utility:** `qrcode` `^1.5.4`, `@types/qrcode` `^1.5.6`

---

## 2. 사용자 요청 전수 수록 (Phase 1 ~ Phase 12)

본 섹션은 프로젝트 시작(2026-11-13)부터 최종화(2026-11-16)까지 사용자가 전달한 모든 기능·UI·데이터·오류 수정 요청을 시간순으로 정리한 전체 히스토리입니다.

### [Phase 1: 프로젝트 초기화 및 메인 홈 화면 구성] (2026-11-13)
1. `- 한글로 출력`
2. `npx create-next-app@latest .` / `npx shadcn@latest init` / `npm run dev`
3. `본 화면 즉, 홈화면의 기능이 정말 많지만 이 단계에서는 간단한 것만 작업한다. - 다크 모드 구현 - 자가진단 안내 버튼 시, 단계별UI로 넘어가는 화면 구성 (화면은 단계별UI파일을 참고한다.)`
4. `맑은 고딕체로 해주고 지금 보이는 화면과 내가 실제로 http://localhost:3000 들어갔을 때 똑같이 안 나와.`
5. `- 우리는 은퇴적령기를 대상으로 웹 페이지를 만들것이기에 30대 직장인 버튼은 삭제한다.`
6. `# 재무주치의 메인 홈페이지 개편`: 서비스명을 '재무주치의'로 통일, 주 고객은 50~60대, 반응형(모바일 1열/태블릿·데스크톱 순서 유지), 명도 대비 및 키보드 접근성 확보.
7. `메인 화면에서 양 옆으로 여백이 남는데 여백없이 사진이 꽉 차게 하고 화질 높여주세요.`

### [Phase 2: 메인 이미지 교체, 로그인 단일 버튼 & Supabase 초기 연동] (2026-11-14)
8. `page.tsx 파일 열고 screen.png 이걸로 바꿔` / `본 화면의 캐릭터를 public 파일의 findoc1과 findoc2 사진으로 바꿔 - 화면틀에 맞추고 고화질, 채도를 낮추어 배치해.`
9. `이 화면 다시 구성해야할 것 같아. 'google 로그인은 준비 중입니다' 버튼은 삭제하고 google 계정으로 시작하기 단일 버튼만 제시해. 계획은 supabase를 활용하여 구글 로그인을 구현할거야.`
10. `npm install @supabase/supabase-js @supabase/ssr` / `lib/supabase/server.ts`, `lib/supabase/client.ts` 초기화 코드 작성.
11. `AGENTS.md에 Supabase 보안 규칙 반영`: PostgREST API 접근을 위한 명시적 `GRANT` (`anon`, `authenticated`) 및 `RLS(Row Level Security)` 활성화 + 인증 유저 본인 데이터 `Policy` 필수 작성.
12. `supabase 연결 확인` 및 `.env.local` 환경변수 설정 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Gemini API 키).
13. GitHub 저장소(`https://github.com/hyeeminna/afpk.git`) 푸시 및 Vercel 배포 진행.
14. `step03 AI 재무상담에서 Google Gemini API 실제 연동 요청` 및 API 키 등록.

### [Phase 3: Google OAuth, `users` 테이블 자동 연동 & 데이터 매핑] (2026-11-15)
15. `supabase를 활용해서 구글 로그인 구현`: 전역 `AuthContext` 설정, Supabase Auth 로그인 사용자 정보를 `public.users` 테이블에 자동 저장(트리거 연동), 로그인 후 프로필 사진 팝오버 및 호버 시 `Sign out` 표시.
16. `가상 고객 데이터 기반 STEP 01/02 재설계`:
    * Supabase Table Editor 데이터 기준으로 자산 현황(1,721,710,000원), 부채 현황(250,000,000원), 월 소득(8,050,000원), 월 지출(7,330,000원), 비상자금(22,000,000원), 재무목표(선택 문항 바탕, 금액·날짜 공란 시작) 재구성.
    * STEP 02 기준월을 11월에서 **`2026년 10월`** 로 전면 수정 (수입 `8,050,000`원, 고정 `2,850,000`원, 변동 `4,150,000`원, 투자 `330,000`원, 부채변화 `-1,016,667`원) 및 9월 독립 비교 데이터(`9월 현금흐름표 가상`) 적용.
17. `계획안 vs 실제안 / 월별 전환 기능`: STEP 01의 불필요한 설계안 작성 기능 제거, STEP 02를 9월/10월 월별 전환 입력 및 비교 구조로 개편.

### [Phase 4: STEP 03 UX 고도화, 계산기형 숫자 입력 & 세무사 QR 상담] (2026-11-15)
18. `STEP 03 AI 상담 답변 형식 개선`: 확정 단일값 대신 구간 추정치 제시, 하단 '다음 행동 제안' 3가지 제시, 질문 입력창 옆 파일 첨부 버튼 삭제.
19. `모든 단계의 숫자 입력란 계산기형 콤마(,000) 적용`: 한글·영문 입력 차단, 입력 즉시 3자리 콤마 적용 및 우측 입력 요약 실시간 반영.
20. `세무사 1:1 카카오톡 QR 상담 모달 구현`: 사이드바 좌측 하단 전용 카드에만 배치(대시보드 내부 메뉴에는 추가하지 않음), CTA 버튼 클릭 시 카카오톡 QR 모달 표시.

### [Phase 5: 내 재무현황 · 목표관리 · 리포트 · 설정 구체화] (2026-11-15)
21. `9월/10월 저장 버튼 및 4대 기능 구체화`:
    * STEP 02의 `분석하기` 버튼을 **`저장하기`** 로 변경, 활용 불가한 설계안 대비 달성률·월 저축률 카드 제거.
    * `내 재무현황`: 재무상태표, 퇴직 전후 월간 현금흐름표, 정밀 진단 표 구현.
    * `목표 관리`: 4대 재무목표 타임라인 및 신호등 카드(대출 상환 2.5억 🟢, 장남 결혼자금 7천만 🟢, 은퇴 생활비 6.88억 🔴, 상가주택 상속 7,760만 🟡) 및 실행 전후(Before & After) 비교.
    * `리포트`: 재무상태표·현금흐름표·재무목표 상세 기반 구성, PDF 다운로드/인쇄/링크 복사 버튼 미구현, 발행일자 실제 이용 날짜 적용, 고객명 익명(로그인 시 해당 고객명).
    * `설정`: Supabase 연동 상태 및 최신 데이터 불러오기 / 기본 데이터 리셋 / 계정·테마·통화 단위 관리.

### [Phase 6: 실명 마스킹, 공란 양식 모드 & 화면 캡처/개발문서화] (2026-11-15)
22. `- 대회에 실명 언급이 안 되므로 한영호 세무사는 '한OO'으로 변경한다.`
23. `- Supabase 데이터를 불러올 수 있도록 설정하고, 모든 금액과 평가 항목을 공란으로 두어 신규 고객이 직접 입력하면 맞춤 재무설계를 작성해주는 '공란 양식 모드'를 구현하라.`
24. `현재 웹의 모든 화면을 캡처하여 저장하고, 지금까지 요청한 내용을 하나의 개발문서 파일로 제시하라.` (`docs/DEVELOPMENT_SPECIFICATION.md` v1.0.0 작성)

### [Phase 7: 리포트 인라인 편집 & 메인 홈 재정비] (2026-11-16 00:55~02:54)
25. `리포트 세부 항목 작성/수정(옵션 A - 리포트 인라인 모달 방식)`: 리포트 상단에 `[ ✍️ 리포트 세부 항목 작성/수정 ]` 버튼 배치하여 PDF 항목별 입력 폼 모달로 작성/수정 시 리포트 전체 즉시 반영.
26. `1분 은퇴 점검 기능 제거 및 4대 핵심 고민 단일 선택 카드 제시`.
27. `데이터 정합성 및 랜딩 로그인 게이트 강화`:
    * `14억 7,069만 원` 등 Supabase 특정 고정값이 신규 고객 공란 모드에 잔존하는 문제 배제.
    * STEP 02 공란 모드 시 가상 실데이터 비교·5~10월 순자산 추이 그래프 배제 및 불필요한 `재무 변동 진단 요약` 삭제.
    * 랜딩 페이지 최하단 진입 등 비로그인 상태에서 `/diagnosis` 직접 진입 차단 → Google 계정 로그인 단일 CTA 안내.
    * 공란 시 순위 자동 확정 금지(`-`), 홈 화면에서 1~4순위 확정값 미표기, 맞춤 재무설계 시작하기 클릭 시 비로그인이면 Google 로그인 CTA로 이동.
    * 메인 화면 `findoc1`, `findoc2` 사진을 각각 노후 처방 / 든든 은퇴 리포트 탭 영역에 배치.

### [Phase 8: 브랜드 표기 교정, 신규 고객 저장 유지 & 불필요 탭 정리] (2026-11-16 03:18~03:34)
28. `자문기관명 & 리포트 메타데이터·단위·로그인 팝오버 수정`:
    * 자문기관 표기를 `ARPK`에서 **`AFPK`** (`AFPK 재무주치의`)로 수정하고, **`수석 PB` 표현 완전 삭제**.
    * 리포트 메타데이터 순서를 **`발행일자` → `자문기관` → `고객명`** 순으로 배치.
    * 가상 데이터 입력 시 고객명이 구글 로그인된 본인 이름으로 덮어쓰이지 않도록 분리.
    * 신규 고객 직접 입력 금액 실시간 반영 및 저장 보장, `~원` 표기 통일, 신호등 상태(달성 가능/사전 합의/위험 경보)는 고객 수기 설정 대신 재무설계사/AI 평가 산출로 고정.
    * Google 로그인 호버 팝오버의 `Sign out` 버튼이 잘리지 않도록 z-index/overflow 수정.
29. `리포트 옆 'PDF' 표기 삭제 및 '설정' 탭 기능 완전 삭제`.
30. `STEP 03 채팅창 바로 아래 중복 추천 질문 칩 삭제` (좌측 추천 질문 가이드로 일원화).
31. `데이터 모드 전환 시 내가 쓴 데이터 영구 보존 및 AI 목표 상담 중심화`:
    * STEP 01~02 이동 또는 `가상 고객 모범안` 불러오기 후에도 사용자가 최초 직접 입력한 재무 데이터를 언제든 복원할 수 있는 **`[ ✍️ 내가 쓴 재무 데이터 불러오기 ]`** 기능 구현.
    * STEP 01 '재무 목표 설정' 입력란 중심으로 AI 재무상담이 이루어지도록 연동.

### [Phase 9: 런타임 오류 해결, STEP 01·02·03·재무현황·AI 페르소나 연동] (2026-11-16 07:37~08:34)
32. `Runtime ReferenceError 수정`: `Can't find variable: parseRawNumber` (`src/app/diagnosis/page.tsx:1904`) 해결 (`parseNumber` 별칭 정의).
33. `STEP 01·02 반영 데이터 기반 STEP 03 질문 및 내 재무현황 충돌 해결`:
    * 내가 불러온/입력한 재무 데이터가 가상 고객 모범안 종합 분석표와 충돌하던 현상 제거.
    * `재무상태표`, `월간현금흐름표`, `자산·보험·세무 정밀 진단` 상세 내역 직접 수정 기능 및 고객 새로 작성 시 **`작성 기준일` 동적 변경(오늘 날짜)** 구현.
    * **`퇴직 직후 월 수지` → `퇴직 직후 월 수치`** 로 명칭 교정 및 실시간 계산 반영.
34. `AI 상담사 페르소나 및 엄수 규칙 부여`:
    * AFPK·CFP 6단계 표준 프로세스 공인 자문가 페르소나 탑재, `dataMode === 'custom'` 시 입력 데이터 외 가상 고객 금액 혼합 금지, 미입력 시 `[가정]` 명시, 미래 예측 구간 추정치 제시, 하단 실행 가능한 3가지 다음 행동 제안.
    * AI 상담 및 페르소나 평가 결과(`evaluatedGoals`)가 목표 진단 및 리포트에 연동되도록 `/api/evaluate-goals` 구축.

### [Phase 10: 홈 배지 제거, 4대 고민별 5대 질문 랜덤 배정 & 변동 비교표 삭제] (2026-11-16 13:17~13:42)
35. `홈 화면의 불필요한 배지/버튼('로그인 없이 즉시 선택', '진단 페이지 →') 삭제`.
36. `STEP 03 초기 질문 5종 랜덤화 & AI 페르소나/출처 규칙 개편`:
    * 기존의 일률적 `"이번 달 남은 잉여금 72만 원 중 40만 원을..."` 고정 시작 질문 폐기.
    * 4대 고객 유형(**부채 상환 / 목돈 마련 / 은퇴 생활비 / 상가주택 상속·절세**) 각각 5개 지정 질문(총 20종) 정의 → 초기 진입 시 해당 고민의 5개 질문 중 1개 랜덤 시작 & 좌측 추천 질문 가이드 5개 목록 연동.
    * 답변 규칙: 핵심 결론 먼저 → 계산 근거 → 다음 행동 3개, 모든 금액 옆 출처 표기 **`(입력값)` / `(계산값)` / `[가정]`**, JSON `evaluatedGoals` 수치와 본문 숫자 일치.
    * 하드코딩된 `retirementDeficit` (`"-592만 원"`)을 실제 계산식으로 교체.
37. `STEP 02의 '월별 재무 변동 비교 (2026년 9월 vs 10월)' 테이블(변동 내역 및 사유 포함) 기능 삭제`.

### [Phase 11: API 진단 오류 해결, 목표 관리 탭 삭제 & 실제 모델명·금액 포맷·고객명 정밀 수정] (2026-11-16 13:48~14:25)
38. `STEP 01·02·03 ↔ Gemini 목표 진단 수치 불일치 및 500 오류 해결`:
    * Google AI Studio 미지원(404) 모델명(`gemini-1.5-*`, `gemini-2.5-*`)을 활성 모델(`gemini-flash-latest`, `gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-pro-latest`)로 교체.
    * API 장애 시에도 500 오류 대신 입력 데이터(`totalDebt`, `totalAsset`, `goalAmount` 등)를 100% 반영하는 AFPK 내장 수식 계산 Fallback 탑재 + `goalEvaluation.ts` 실시간 동기화 보정.
39. `실제 구동되는 Gemini 모델명 UI 동적 표기`:
    * UI에 임의로 'Gemini Pro'를 하드코딩하지 않고, 실제 작동한 모델명(`usedModel`, 예: `gemini-flash-latest` 또는 `gemini-3.8-flash`)을 API가 반환하여 **버튼, 3번 표 우측 헤더, 회색 정밀 진단 반영 안내 문구**에 동일하게 표시.
40. **`목표 관리` 탭 기능 완전 삭제**:
    * 리포트 탭의 `3. 재무목표 상세 및 순위·기한·금액 진단`과 중복되므로 사이드바 및 뷰에서 `목표 관리` 탭을 완전히 삭제.
41. `리포트 고객명 규칙 확정`:
    * 가상 고객 모범안 모드일 때만 **`김한국 님`**, 그 외 직접 입력 모드에서는 **구글 로그인 연동 본인 이름**(`profile.full_name` / `user_metadata.full_name`)을 표시.
42. `한글 통화 포맷터 만 단위 미만 절삭 버그 수정`:
    * `89,300원`이 **`8만 원`** 으로 잘못 표시되던 `formatKoreanCurrency` / `formatKoreanAmount` 조건식 버그를 수정하여 **`8만 9,300원`** 으로 정확히 표시되도록 개선.
43. `Next.js Blocking Route 에러 해결`: `diagnosis/page.tsx`에서 `Math.random()`을 제거하고 타임스탬프 기반 인덱스(`Math.floor((Date.now() / 1000) % 5)`)를 적용.

### [Phase 12: 런타임 `g.rank.split` 오류 수정, TypeScript 정합성 확보 & 최종 개발문서 통합] (2026-11-16 14:32~15:01)
44. `Runtime TypeError: undefined is not an object (evaluating 'g.rank.split')` 해결:
    * `ReportView.tsx`, `goalEvaluation.ts`, `api/evaluate-goals/route.ts` 3개 레이어 모두에서 `goals` 항목(`rank`, `name`, `period`, `needed`, `prep`, `shortage`, `status` 등)에 대한 null-safe 가드 및 fallback 병합 적용.
    * `ReportView.tsx`에서 `UserProfile` 타입(`src/contexts/auth-context.tsx`)에 없는 `profile?.name`을 `profile?.full_name`으로 교정해 `npx tsc --noEmit` 오류 `0`건 달성.
45. `최종 통합 개발 명세서 작성`: `doc/development_specification_final.md` (및 `docs/development_specification_final.md`) 생성.

---

## 3. 화면별 최종 상세 기능 및 UI/UX 구현 명세

### 3.1 메인 홈 (`/`, `src/app/page.tsx`)
* **헤더 & 인증 POPOVER (`src/components/user-profile-popover.tsx`):**
  * 브랜드: `재무주치의 (은퇴 안심 케어)`, 테마 토글(`ThemeToggle`), 비로그인 시 로그인 버튼 / 로그인 시 구글 프로필 사진 + 이름 팝오버(호버 시 `Sign out` 노출, z-index 확보로 가려짐 방지).
* **Hero & 캐릭터 쇼케이스 (`findoc1`, `findoc2`):**
  * 탭 전환형 캐릭터 카드: `findoc1` (`노후 처방` 3D 닥터 일러스트) / `findoc2` (`든든 은퇴 리포트` 2D 일러스트).
  * `로그인 없이 즉시 선택`, `진단 페이지 →` 등 불필요 배지 및 링크는 제거 완료.
* **4대 핵심 고민 선택 카드 (단일 선택, `CORE_CONCERNS`):**
  1. `debt` (`💳 부채 상환`): `은퇴 전 대출 2.5억 전액 상환` (`goalName`: `은퇴 전 대출 2.5억 전액 상환`)
  2. `wedding` (`💍 목돈 마련`): `자녀(장남) 결혼자금 7,000만 원 지원` (`goalName`: `장남 결혼자금 7,000만 원 마련`)
  3. `living` (`🛡️ 은퇴 생활비`, 기본 선택): `은퇴 후 생활비 월 300만 원 평생 확보` (`goalName`: `은퇴 후 생활비 월 300만 원 확보`)
  4. `inheritance` (`🏢 상속 및 절세`): `상가주택 상속 대비 및 절세 플랜` (`goalName`: `상가주택 상속 및 절세 대비`)
  * 선택 시 `sessionStorage` (`financialDoctor_concern`, `financialDoctor_goalName`)에 저장.
  * `맞춤 재무설계 시작하기` 클릭 시 비로그인 사용자는 Google 로그인 CTA 섹션(`#login`)으로 안내·스크롤하며, 로그인 완료 사용자만 `/diagnosis`로 진입 (`diagnosis/page.tsx` 마운트 가드에서도 비로그인 직접 접근 차단).
* **Google 계정 로그인 섹션 (`#login`):**
  * `Google 계정으로 시작하기` 단일 CTA 버튼 제공 (Supabase OAuth 연동).

### 3.2 대시보드 공통 헤더 & 데이터 모드 스위처 (`src/app/diagnosis/page.tsx`)
* **좌측 사이드바 네비게이션:**
  * `홈 (/)`
  * `재무설계` 그룹: `STEP 01 설계안 등록` / `STEP 02 월별 변동 입력` / `STEP 03 AI 재무상담`
  * `내 재무현황` (`financial_status`)
  * `리포트` (`report`)
  * 최하단 전용 카드: `✦ 세무사 상담 (한OO 세무사 카카오톡 문의하기 →)`
* **상단 3대 데이터 모드 전환 버튼:**
  1. `✍️ 내가 쓴 재무 데이터 불러오기` (`handleRestoreUserCustomData`): 사용자가 `custom` 모드에서 입력·저장한 재무 데이터를 `localStorage` 백업에서 즉시 복원.
  2. `✦ 가상 고객 모범안` (`handleLoadSupabaseData`): 50대 은퇴 설계 모범 데이터(총자산 `1,721,710,000`, 총부채 `250,000,000`, 월소득 `8,050,000`, 월지출 `7,330,000`, 비상자금 `22,000,000`) 적용.
  3. `↩️ 공란 초기화` (`handleResetToBlank`): 모든 입력 필드와 리포트/재무현황 상세 항목을 빈 양식(`isTemplateBlank = true`)으로 초기화.

### 3.3 STEP 01 재무설계안 등록 (`src/app/diagnosis/page.tsx`)
* **계산기형 숫자 입력 포맷터 (`formatCalculatorNumber`):** 숫자 외 한글·영문·특수문자 차단 및 입력 즉시 천 단위 `,000` 콤마 포맷팅.
* **한국어 금액 변환기 (`formatKoreanCurrency`):**
  * `조`, `억`, `만` 단위와 **만 단위 미만 잔여 금액(`remainder > 0`)까지 누락 없이 출력** (`89,300` → `8만 9,300원`, 기존 `8만원` 오표기 버그 수정 완료).
* **입력 항목:**
  * 총 자산 (`totalAsset`), 총 부채 (`totalDebt`), 세후 월 소득 (`monthlyIncome`), 월 지출 (`monthlyExpense`), 비상자금 (`emergencyFund`)
  * **재무 목표 설정:** 목표 명칭 (`goalName`), 필요 자금 (`goalAmount`), 목표 시점 (`goalDate`) — 신호등 판정은 고객이 입력하지 않고 AFPK/AI 엔진이 자동 평가.
* **우측 실시간 요약 패널:** 순자산(`parsedAsset - parsedDebt`), 월 저축가능액/적자(`parsedIncome - parsedExpense`), 저축률(%) 실시간 계산 및 반영.

### 3.4 STEP 02 월별 변동 입력 (`src/app/diagnosis/page.tsx`)
* **대상 월 독립 선택 및 저장:** `2026년 9월` ↔ `2026년 10월` 전환 시 각 월의 5개 항목(`수입`, `고정지출`, `변동지출`, `투자/저축`, `자산/부채 변동`)이 독립 상태로 유지되며 `저장하기` 버튼 제공.
* **정리된 UI 범위:**
  * Supabase에서 활용 불가한 설계안 대비 달성률·월 저축률 카드 제거.
  * 불필요한 `재무 변동 진단 요약` 및 `월별 재무 변동 비교 (변동 내역 및 사유)` 테이블 삭제 완료.
  * 공란 작성 모드(`isTemplateBlank`)에서는 가상 비교·5~10월 추이 그래프가 혼재되지 않도록 분리.

### 3.5 STEP 03 AI 재무상담 (`src/app/diagnosis/page.tsx` & `/api/chat`)
* **4대 고객 유형별 5대 핵심 질문 총 20종 (`CONCERN_QUESTIONS_MAP`):**
  * 홈페이지에서 선택한 고민 또는 STEP 01 목표(`detectConcernKey`)에 따라 고객 유형(`debt`, `wedding`, `living`, `inheritance`)을 자동 판별하고, 타임스탬프 기반 인덱스(`Math.floor((Date.now() / 1000) % 5)`)로 **5개 질문 중 1개 질문과 맞춤 초기 자문 응답을 랜덤 지정**합니다.
  * 좌측 `💡 추천 질문 가이드 (5대 핵심 질문)`에는 상단 **4대 고민 유형 전환 탭**(💳 부채 상환 / 🎁 결혼자금 / 🏖️ 은퇴생활비 / 🏛️ 상속·절세)과 해당 유형의 **5개 질문 버튼**이 노출되어 클릭 즉시 채팅 입력창에 채워집니다.

| 고객 유형 | 5대 지정 질문 목록 (추천 질문 가이드 & 랜덤 초기 질문) |
| :--- | :--- |
| **1. 부채 상환 고객**<br>(`은퇴 전 대출 2.5억 전액 상환`) | 1. 은퇴까지 남은 기간 안에 2.5억을 다 갚으려면 매달 얼마씩 상환해야 하나요?<br>2. 원리금균등, 원금균등, 중도상환 가운데 저한테 가장 유리한 방식은 무엇인가요?<br>3. 여윳돈이 생기면 대출을 먼저 갚는 게 나을까요, 투자해서 불리는 게 나을까요?<br>4. 금리가 오르거나 내리면 상환 계획이 어떻게 달라지나요?<br>5. 대출을 갚느라 노후자금(연금, 저축)이 부족해지지는 않을까요? |
| **2. 목돈 마련 고객**<br>(`장남 결혼자금 7,000만 원 지원`) | 1. 결혼 시점까지 7,000만 원(금액은 변동 가능)을 모으려면 매달 얼마를 저축하거나 투자해야 하나요?<br>2. 자녀에게 7,000(금액은 변동 가능)만 원을 주면 증여세가 얼마나 나오나요? 결혼자금 증여공제를 받을 수 있나요?<br>3. 한 번에 주는 것과 나눠서 주는 것 중 세금 면에서 어느 쪽이 유리한가요?<br>4. 결혼자금을 지원하면 제 은퇴자금에 얼마나 영향이 있나요?<br>5. 남은 기간을 생각하면 어떤 금융상품(예적금, ISA, 펀드 등)으로 준비하는 게 좋을까요? |
| **3. 은퇴 생활비 고객**<br>(`월 300만 원 평생 확보`) | 1. 국민연금과 퇴직연금을 합치면 매달 얼마나 받을 수 있고, 300만 원(금액은 변동 가능)까지 얼마나 모자라나요?<br>2. 물가상승을 반영하면 지금의 월 300만 원(금액은 변동 가능)은 은퇴 시점에 얼마가 되나요?<br>3. 100세까지 산다고 가정하면 은퇴 시점에 총 얼마가 있어야 하나요?<br>4. 연금저축, IRP, 즉시연금 가운데 평생 소득을 만들려면 무엇을 어떻게 조합해야 하나요?<br>5. 국민연금을 앞당겨 받는 것과 늦춰 받는 것 중 저한테 어떤 게 유리한가요? |
| **4. 상가주택 상속 대비 절세 고객**<br>(`상가주택 상속 및 절세 대비`) | 1. 지금 상가주택을 상속하면 상속세가 대략 얼마나 나오나요?<br>2. 미리 증여하는 것과 상속하는 것 중 세금 면에서 어느 쪽이 유리한가요?<br>3. 상가주택은 시가와 기준시가 가운데 어느 금액으로 평가되나요? 감정평가를 받는 게 유리한가요?<br>4. 자녀 여러 명에게 어떻게 나눠야 세금도 줄이고 분쟁도 막을 수 있나요?<br>5. 상속세 낼 현금이 부족하면 어떻게 준비해야 하나요? (종신보험, 연부연납, 물납 등) |

* **AI 중점 상담 목표 카드 (STEP 01 연동):**
  * STEP 01의 목표명·필요자금·달성시점을 실시간 표시.
  * `[ ✨ {evaluatedModelName} 재무목표 정밀 진단 실행 ]` 버튼 및 `{evaluatedModelName} AI 정밀 진단 결과 반영됨 (리포트 연동)` 상태 배지 제공.
* **채팅 UI 규칙:** 파일 첨부 버튼 없음, 채팅창 하단 중복 추천 칩 없음, 현재 재무상태 요약 카드(`STEP 01·02` 실데이터) 좌측 표시.

### 3.6 내 재무현황 종합 분석표 (`src/components/FinancialStatusView.tsx`)
* **상단 KPI 카드:** 총 자산, 총 부채, 순자산, 현재 월 잉여금, **`퇴직 직후 월 수치`** (`퇴직 직후 월 수지`에서 명칭 수정 완료, `cleanExpense` 기반 실시간 연산).
* **작성 기준일 동적 관리:** 가상 모범안 모드 기본 `"2026. 10. 31"`, 신규 고객 작성 시 오늘 날짜(`getTodayStr()`) 적용 및 인라인 기준일 수정 지원.
* **3대 서브 탭 & 직접 편집 모달 (`showEditModal`):**
  1. `1. 자산·부채 상태표 (재무상태표)`: 자산 구성 비중 바 차트 및 세부 항목(현금성·투자·은퇴·부동산·부채) 직접 작성/수정 가능.
  2. `2. 월간 현금흐름표 (퇴직 전 vs 퇴직 후)`: 근로소득 절벽 및 퇴직 직후 월 수치 비교, 항목 직접 수정 가능.
  3. `3. 자산·보험·세무 정밀 진단`: 부채비율, 비상예비자금 개월 수, 부동산/세무/보험 진단 지표.

### 3.7 공인 은퇴설계 종합 진단 리포트 (`src/components/ReportView.tsx`)
* **상단 액션 바:**
  * `[ ✨ {evaluatedModelName} AI 목표 재진단 ]`
  * `[ ✍️ 리포트 세부 항목 작성/수정 ]` (인라인 모달: 고객정보 / 자산·부채 / 현금흐름 / 재무목표 / 자문의견 5개 탭 편집)
  * `세무사 검토 요청` (`한OO 세무사` QR 모달 오픈)
  * **제거된 버튼:** PDF 다운로드, 인쇄하기, 링크 복사 버튼 및 사이드바/헤더 `PDF` 표기 완전 제거.
* **공식 문서 헤더 메타데이터 순서 (`ReportView.tsx:558-575`):**
  1. **발행일자:** 당일 실제 이용 날짜 (`todayStr`, 또는 사용자 지정일)
  2. **자문기관:** **`AFPK 재무주치의`** (`ARPK`, `수석 PB` 표기 금지)
  3. **고객명:**
     * 가상 고객 모드(`!isTemplateBlank`): **`김한국 님`**
     * 그 외 직접 입력 모드(`isTemplateBlank`): 수기 입력 고객명 또는 **구글 로그인 연동 본인 이름** (`profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || ...`)
* **4대 진단 섹션:**
  1. `1. 재무상태표 요약 (자산 및 부채 현황)`
  2. `2. 은퇴 전후 월간 현금흐름 비교`
  3. `3. 재무목표 상세 및 순위·기한·금액 진단`
     * 우측 헤더(회색 문구)에 실제 사용된 Gemini 모델명 동적 표기: **`{evaluatedModelName} AI 정밀 진단 반영`**
     * `evaluateFinancialGoals()` (`src/lib/goalEvaluation.ts`)를 통해 STEP 01/02 입력 수치(`totalDebt`, `totalAsset`, `monthlyIncome`, `monthlyExpense`, `goalName`, `goalAmount`, `goalDate`) 및 STEP 03 AI 평가 결과(`aiGoals`)와 실시간 100% 동기화.
     * 공란 입력 대기 시 순위 `-`, 상태 `진단 대기 ⚪`.
  4. `4. 종합 자문 소견 및 다음 행동 (Action Plan)`

### 3.8 한OO 세무사 1:1 상담 QR 모달 (`src/app/diagnosis/page.tsx`)
* **배치 위치:** 좌측 사이드바 최하단 전용 카드.
* **실명 마스킹 준수:** 타이틀 **`한OO 세무사`**.
* **구성:** 카카오톡 ID 복사(`hyh1908`), 카카오톡 QR 연결 안내 UI.

---

## 4. AI 상담사 페르소나 · 모델 연동 · 목표 정밀 평가 명세

### 4.1 AI 재무상담사 시스템 프롬프트 (`src/app/api/chat/route.ts`)
* **역할:** `'재무주치의'의 은퇴설계 상담사` (50·60대 고객 대상, AFPK 재무설계 프로세스: 고객 정보 수집 → 재무상태 분석 → 대안 제시 → 실행 → 점검 준수).
* **다루는 4대 고민:** ① 은퇴 전 부채 상환 ② 자녀 결혼자금 마련 ③ 은퇴 생활비 확보 ④ 상가주택 상속·절세.
* **권한 및 답변 형식:**
  * `financialContext` 내 입력 숫자로 재무상태표·현금흐름·목표 부족액 계산 및 계산식 제시.
  * 국민연금·IRP·연금저축·주택연금·증여/상속세·연부연납 등 제도 일반 원리 설명, 대안 2~3개 장단점 비교, 정보 부족 시 되묻기.
  * 쉬운 말·존댓말·**핵심 결론 먼저 → 계산 근거 → 다음 행동 3개** (`### 다음 행동 제안`).
  * **모든 금액 옆 출처 표기 필수:** **`(입력값)` / `(계산값)` / `[가정]`**.
  * `dataMode === 'custom'`일 때 `financialContext` 외 가상 고객 숫자 혼합 금지, 미입력 항목은 `[가정]` 명시, 미래 예측치는 구간 추정치 제시.
  * JSON 응답의 `evaluatedGoals` 숫자는 본문 숫자와 반드시 일치.
  * 구체적 세무·법률 신고 판단은 전담 세무사(`한OO 세무사`) 상담 병행 안내.

### 4.2 목표 정밀 평가 API & 클라이언트 동기화 엔진
* **API 라우트 (`/api/evaluate-goals/route.ts`):**
  * 입력된 `dataMode`, `financialContext`, `chatHistory`를 기반으로 4대 목표(`id`: `"debt"`, `"custom_goal"`, `"retirement"`, `"emergency"`) 및 실행 전후 `solutions` 4항목 산출.
  * `dataMode === 'custom'`일 때 `debt.needed`와 `custom_goal.needed`를 사용자 입력 `totalDebt` 및 `goalAmount`로 강제 정합성 보정하며, `fallbackResult.goals[idx]` 병합으로 누락 필드(`rank`, `name`, `period`, `needed`, `prep`, `shortage`, `status`, `statusCode`, `expertOpinion`) 방지.
  * 응답에 실제로 호출 성공한 모델명 **`usedModel`** 을 포함하여 반환.
* **클라이언트 동기화 엔진 (`src/lib/goalEvaluation.ts`):**
  * `evaluateFinancialGoals()`가 `aiGoals` 수신 시에도 현재 STEP 01 입력값(`cleanDebt`, `cleanGoalAmount`, `cleanExpense`, `cleanAsset`, `cleanIncome`)과 실시간 동기화하며, `formatKoreanAmount()`에서 만 단위 미만 원 단위(`rest > 0`)까지 정확히 변환.

---

## 5. 디자인 시스템 및 스타일 가이드 (`src/app/globals.css`)

### 5.1 핵심 컬러 팔레트
| 용도 | Light / CSS 변수 | Dark / Tailwind Class | 설명 |
| :--- | :--- | :--- | :--- |
| **Main Surface** | `#faf8ff` (`--color-surface`) | `#0B1120` / `#0B1329` | 전체 배경 |
| **Card / Container** | `#ffffff` (`--color-surface-container-lowest`) | `#11192E` / `#1E293B` | 카드·입력 폼·리포트 컨테이너 |
| **Sidebar / Tax Card** | `#0D162B` / `#131F37` | `#0D162B` / `#131F37` | 좌측 네비게이션 및 세무사 카드 |
| **Primary Brand Blue** | `#00288e` / `#2563EB` (`bg-blue-600`) | `#60A5FA` / `#2563EB` | 활성 탭, 주요 CTA 버튼, 강조 수치 |
| **Hero Header Navy** | `#0B2568` / `#0F224A` → `#1E3A8A` | `#07194A` | STEP 배너 및 리포트 헤더 |
| **Status Green (달성 가능)** | `#10B981` (`emerald-500`) | `emerald-400` | `달성 가능 🟢` 신호등 |
| **Status Amber (사전 합의)** | `#F59E0B` (`amber-500`) | `amber-400` | `사전 합의 🟡` 신호등 |
| **Status Red (위험 경보)** | `#EF4444` / `#ba1a1a` (`red-500`) | `red-400` | `위험 경보 🔴` 신호등 |

### 5.2 타이포그래피
* **기본 폰트:** `"Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif` (`*` 전역 적용)
* **숫자/코드:** `"JetBrains Mono", monospace` (`.font-label-numeric`, `.font-mono`)

---

## 6. 데이터베이스 스키마 및 보안 규칙 (Supabase & RLS)

### 6.1 사용자 테이블 및 OAuth 자동 연동 (`supabase/migrations/20261115_create_users_table.sql`)
* `public.users` (`id`, `email`, `full_name`, `avatar_url`, `provider`, `created_at`, `updated_at`) 생성.
* `auth.users` INSERT/UPDATE 시 `public.handle_new_user()` 트리거(`SECURITY DEFINER`)가 Google 프로필(`full_name`, `avatar_url`)을 자동 동기화.

### 6.2 `AGENTS.md` Supabase 필수 보안 정책
모든 Supabase 테이블 생성·마이그레이션 시 아래 두 규칙을 예외 없이 적용합니다:
1. **명시적 권한 부여 (`GRANT`):**
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO authenticated;
   GRANT SELECT ON TABLE public.<table_name> TO anon;
   ```
2. **RLS 활성화 및 본인 데이터 접근 정책 (`Policy`):**
   ```sql
   ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Allow authenticated users to select own data"
     ON public.<table_name> FOR SELECT TO authenticated USING (auth.uid() = id);
   CREATE POLICY "Allow authenticated users to insert own data"
     ON public.<table_name> FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
   CREATE POLICY "Allow authenticated users to update own data"
     ON public.<table_name> FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
   CREATE POLICY "Allow authenticated users to delete own data"
     ON public.<table_name> FOR DELETE TO authenticated USING (auth.uid() = id);
   ```

---

## 7. 프로젝트 파일 구조 및 로컬 복제 실행 가이드

### 7.1 주요 소스 및 문서 구조
```text
afpk/
├── AGENTS.md                                      # Next.js 16 안내 및 Supabase GRANT/RLS 필수 규칙
├── next.config.ts                                 # Turbopack, cacheComponents, partialPrefetching 설정
├── package.json                                   # Next 16.4.6, React 19.3.0, Supabase, Tailwind 4
├── doc/development_specification_final.md         # 최종 통합 개발 명세서 (본 문서)
├── docs/
│   ├── DEVELOPMENT_SPECIFICATION.md               # 초기 통합 명세서 (v1.0.0)
│   ├── development_specification_final.md         # 최종 통합 개발 명세서 (v2.0.0)
│   └── design_screens/                            # 화면 레퍼런스 캡처 (01~09)
├── supabase/migrations/
│   └── 20261115_create_users_table.sql            # public.users 테이블, GRANT/RLS 및 Auth 트리거
└── src/
    ├── app/
    │   ├── layout.tsx                             # 전역 폰트, ThemeProvider, AuthProvider
    │   ├── globals.css                            # 맑은 고딕, 컬러 토큰 및 다크모드 스타일
    │   ├── page.tsx                               # 메인 홈페이지 (4대 고민 단일 선택, Google 로그인 CTA)
    │   ├── auth/callback/                         # Supabase Google OAuth 콜백 라우트
    │   ├── diagnosis/page.tsx                     # 5단계 재무설계 워크스페이스 & STEP 01~03, 세무사 모달
    │   └── api/
    │       ├── chat/route.ts                      # STEP 03 AI 재무상담 API (AFPK 페르소나)
    │       └── evaluate-goals/route.ts            # 4대 재무목표 정밀 평가 API (usedModel + Fallback)
    ├── components/
    │   ├── FinancialStatusView.tsx                # 내 재무현황 (재무상태표, 현금흐름표, 퇴직 직후 월 수치)
    │   ├── ReportView.tsx                         # 공인 은퇴설계 종합 진단 리포트 & 인라인 편집 모달
    │   ├── user-profile-popover.tsx               # 로그인 프로필 및 Sign out 팝오버
    │   ├── theme-provider.tsx / theme-toggle.tsx  # 다크/라이트 테마 관리
    │   └── ui/button.tsx                          # 공용 UI 버튼
    ├── contexts/auth-context.tsx                  # Google Auth 상태 및 UserProfile 관리
    └── lib/
        ├── goalEvaluation.ts                      # 재무목표 실시간 계산·동기화 및 formatKoreanAmount
        └── supabase/{client.ts, server.ts}        # Supabase 클라이언트/서버 인스턴스
```

### 7.2 환경변수 (`.env.local`) 및 로컬 실행 가이드
```env
# Supabase Cloud Database & Auth Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vjsrzonqapkudmosehsb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<YOUR_SUPABASE_PUBLISHABLE_KEY>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>

# Google Gemini API Configuration (STEP 03 상담 및 목표 정밀 진단)
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
```

```bash
# 1. 저장소 복제 및 패키지 설치
git clone https://github.com/hyeeminna/afpk.git
cd afpk
npm install

# 2. 타입 검사 및 개발 서버 실행
npx tsc --noEmit
npm run dev
# -> http://localhost:3000 접속
```
