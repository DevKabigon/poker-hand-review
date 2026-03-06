BEGIN;

ALTER TABLE public.hands
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.hands
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_hands_share_token
  ON public.hands(share_token)
  WHERE share_token IS NOT NULL;

GRANT SELECT ON public.hands TO anon;

DROP POLICY IF EXISTS "hands_select_shared" ON public.hands;
CREATE POLICY "hands_select_shared"
  ON public.hands
  FOR SELECT
  TO anon, authenticated
  USING (is_shared = true AND share_token IS NOT NULL);

COMMIT;

