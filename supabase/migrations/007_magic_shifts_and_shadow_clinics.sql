-- ============================================================
-- 007_magic_shifts_and_shadow_clinics.sql
-- Enables shadow clinic accounts from WhatsApp & magic shifts
-- ============================================================

-- 1. Allow clinics.user_id to be nullable for shadow/unclaimed accounts
ALTER TABLE public.clinics ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add is_claimed flag to clinics
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT true;

-- 3. Add magic shift columns to shifts
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS magic_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS magic_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS magic_contact_name TEXT,
ADD COLUMN IF NOT EXISTS is_whatsapp_source BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS raw_whatsapp_text TEXT;

-- 4. Create an index on magic_token and magic_contact_phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_shifts_magic_token ON public.shifts(magic_token);
CREATE INDEX IF NOT EXISTS idx_shifts_magic_phone ON public.shifts(magic_contact_phone);

-- 5. Update shift status check constraint to include 'pending_review'
ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS shifts_status_check;
ALTER TABLE public.shifts ADD CONSTRAINT shifts_status_check 
  CHECK (status IN ('pending_review', 'pending_payment', 'active', 'confirmed', 'completed', 'cancelled'));

-- 6. Add policy to allow public reading of magic shifts via their unguessable token
DROP POLICY IF EXISTS "public_read_magic_shifts" ON public.shifts;
CREATE POLICY "public_read_magic_shifts" ON public.shifts
  FOR SELECT USING (magic_token IS NOT NULL);
