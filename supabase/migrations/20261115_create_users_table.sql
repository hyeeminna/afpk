-- ==========================================================
-- 1. users 테이블 생성 (Supabase Auth와 자동 연동)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT DEFAULT 'google',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 2. 명시적 권한 부여 (AGENTS.md 보안 규칙 준수)
-- ==========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO anon;

-- ==========================================================
-- 3. Row Level Security (RLS) 활성화 및 보안 정책
-- ==========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 삭제 후 재작성
DROP POLICY IF EXISTS "Allow authenticated users to select own data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert own data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update own data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to delete own data" ON public.users;

-- 본인 데이터 조회 정책
CREATE POLICY "Allow authenticated users to select own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 본인 데이터 등록 정책
CREATE POLICY "Allow authenticated users to insert own data"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 본인 데이터 수정 정책
CREATE POLICY "Allow authenticated users to update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 본인 데이터 삭제 정책
CREATE POLICY "Allow authenticated users to delete own data"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ==========================================================
-- 4. Supabase Auth 사용자 생성 시 public.users에 자동 저장 트리거
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'google')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 바인딩 (회원가입 또는 로그인 시 자동 실행)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
