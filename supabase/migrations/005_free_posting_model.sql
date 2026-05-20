-- ============================================================
-- 005_free_posting_model.sql
-- Clinics can now post shifts for free (no pending_payment gate).
-- Payment is enforced at the confirmation step via API logic.
-- ============================================================

-- Allow clinics to insert shifts with status 'active' directly
DROP POLICY IF EXISTS "clinics_insert_shifts" ON public.shifts;
CREATE POLICY "clinics_insert_shifts" ON public.shifts
  FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    AND status = 'active'
  );

-- Simplify update policy — no more pending_payment special-casing
DROP POLICY IF EXISTS "clinics_update_shifts" ON public.shifts;
CREATE POLICY "clinics_update_shifts" ON public.shifts
  FOR UPDATE USING (clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()))
  WITH CHECK (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
  );
