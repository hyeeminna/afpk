<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Supabase 데이터베이스 및 테이블 정책 규칙 (Database & Security Rules)

앞으로 Supabase 데이터베이스 테이블을 생성하거나 액세스 관련 SQL 및 마이그레이션 코드를 작성할 때는 항상 다음 규칙을 엄격히 적용합니다:

### 1. 명시적 권한 부여 (GRANT) 필수
- `anon`과 `authenticated` 역할(Role)이 PostgREST API를 통해 이 테이블에 접근할 수 있도록 명시적인 `GRANT` SQL 문(`SELECT`, `INSERT`, `UPDATE`, `DELETE` 등)을 반드시 포함합니다.
- 예시:
  ```sql
  -- 인증된 사용자에게 테이블 접근 권한 부여
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO authenticated;

  -- 익명 사용자(anon) 접근이 필요한 경우 (필요 시 선택 적용)
  GRANT SELECT ON TABLE public.<table_name> TO anon;
  ```

### 2. RLS(Row Level Security) 활성화 및 Policy 작성 필수
- 테이블 생성 시 반드시 RLS를 활성화합니다:
  ```sql
  ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
  ```
- 인증된 유저(`authenticated`)만 자신의 데이터를 안전하게 읽고 쓸 수 있도록 구체적인 보안 정책(Policy)을 반드시 함께 작성합니다:
  ```sql
  -- 인증된 사용자 자신의 데이터 조회 정책
  CREATE POLICY "Allow authenticated users to select own data"
    ON public.<table_name>
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  -- 인증된 사용자 자신의 데이터 등록 정책
  CREATE POLICY "Allow authenticated users to insert own data"
    ON public.<table_name>
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  -- 인증된 사용자 자신의 데이터 수정 정책
  CREATE POLICY "Allow authenticated users to update own data"
    ON public.<table_name>
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- 인증된 사용자 자신의 데이터 삭제 정책
  CREATE POLICY "Allow authenticated users to delete own data"
    ON public.<table_name>
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  ```
