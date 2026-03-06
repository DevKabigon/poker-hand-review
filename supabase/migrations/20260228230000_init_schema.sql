BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.hands (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  hand_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  title TEXT,
  tags TEXT[],
  final_street TEXT,
  total_pot_chips INTEGER,
  button_seat INTEGER NOT NULL,
  saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hands_final_street_check
    CHECK (final_street IN ('PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN') OR final_street IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_hands_user_id ON public.hands(user_id);
CREATE INDEX IF NOT EXISTS idx_hands_user_created_at ON public.hands(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hands_saved_at ON public.hands(saved_at DESC);

DROP TRIGGER IF EXISTS trg_hands_set_updated_at ON public.hands;
CREATE TRIGGER trg_hands_set_updated_at
  BEFORE UPDATE ON public.hands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hands_select_own" ON public.hands;
CREATE POLICY "hands_select_own"
  ON public.hands
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hands_insert_own" ON public.hands;
CREATE POLICY "hands_insert_own"
  ON public.hands
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hands_update_own" ON public.hands;
CREATE POLICY "hands_update_own"
  ON public.hands
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hands_delete_own" ON public.hands;
CREATE POLICY "hands_delete_own"
  ON public.hands
  FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hands TO authenticated;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL CHECK (char_length(username) BETWEEN 1 AND 24),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
      NEW.id::text
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET username = COALESCE(
    NULLIF(public.profiles.username, ''),
    EXCLUDED.username
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;
