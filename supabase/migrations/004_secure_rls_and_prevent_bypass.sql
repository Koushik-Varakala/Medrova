-- ============================================================
-- 004_secure_rls_and_prevent_bypass.sql
-- Granular RLS policies to prevent self-verification,
-- shift status bypasses, and self-confirmation of applications.
-- ============================================================

-- 1. Tighten RLS on public.clinics
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinics_own_profile" ON public.clinics;
DROP POLICY IF EXISTS "clinics_select_own" ON public.clinics;
DROP POLICY IF EXISTS "clinics_insert_own" ON public.clinics;
DROP POLICY IF EXISTS "clinics_update_own" ON public.clinics;

CREATE POLICY "clinics_select_own" ON public.clinics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clinics_insert_own" ON public.clinics
  FOR INSERT WITH CHECK (auth.uid() = user_id AND verification_status = 'pending');

CREATE POLICY "clinics_update_own" ON public.clinics
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      verification_status IS NOT DISTINCT FROM (
        SELECT verification_status FROM public.clinics WHERE id = public.clinics.id
      )
    )
  );


-- 2. Tighten RLS on public.doctors
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_own_profile" ON public.doctors;
DROP POLICY IF EXISTS "doctors_select_own" ON public.doctors;
DROP POLICY IF EXISTS "doctors_insert_own" ON public.doctors;
DROP POLICY IF EXISTS "doctors_update_own" ON public.doctors;

CREATE POLICY "doctors_select_own" ON public.doctors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "doctors_insert_own" ON public.doctors
  FOR INSERT WITH CHECK (auth.uid() = user_id AND verification_status = 'pending');

CREATE POLICY "doctors_update_own" ON public.doctors
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      verification_status IS NOT DISTINCT FROM (
        SELECT verification_status FROM public.doctors WHERE id = public.doctors.id
      )
    )
  );


-- 3. Tighten RLS on public.healthcare_professionals
ALTER TABLE public.healthcare_professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professionals_own_profile" ON public.healthcare_professionals;
DROP POLICY IF EXISTS "professionals_select_own" ON public.healthcare_professionals;
DROP POLICY IF EXISTS "professionals_insert_own" ON public.healthcare_professionals;
DROP POLICY IF EXISTS "professionals_update_own" ON public.healthcare_professionals;

CREATE POLICY "professionals_select_own" ON public.healthcare_professionals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "professionals_insert_own" ON public.healthcare_professionals
  FOR INSERT WITH CHECK (auth.uid() = user_id AND verification_status = 'pending');

CREATE POLICY "professionals_update_own" ON public.healthcare_professionals
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      verification_status IS NOT DISTINCT FROM (
        SELECT verification_status FROM public.healthcare_professionals WHERE id = public.healthcare_professionals.id
      )
    )
  );


-- 4. Tighten RLS on public.shifts (Prevents free activation)
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinics_manage_shifts" ON public.shifts;
DROP POLICY IF EXISTS "clinics_select_shifts" ON public.shifts;
DROP POLICY IF EXISTS "clinics_insert_shifts" ON public.shifts;
DROP POLICY IF EXISTS "clinics_update_shifts" ON public.shifts;
DROP POLICY IF EXISTS "clinics_delete_shifts" ON public.shifts;

CREATE POLICY "clinics_select_shifts" ON public.shifts
  FOR SELECT USING (clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()));

CREATE POLICY "clinics_insert_shifts" ON public.shifts
  FOR INSERT WITH CHECK (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()) 
    AND status = 'pending_payment'
  );

CREATE POLICY "clinics_update_shifts" ON public.shifts
  FOR UPDATE USING (clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()))
  WITH CHECK (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()) 
    AND (
      status IS NOT DISTINCT FROM (
        SELECT status FROM public.shifts WHERE id = public.shifts.id
      ) 
      OR status = 'pending_payment'
    )
  );

CREATE POLICY "clinics_delete_shifts" ON public.shifts
  FOR DELETE USING (clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid()));


-- 5. Tighten RLS on public.applications (Prevents self-confirmation)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctors_own_applications" ON public.applications;
DROP POLICY IF EXISTS "doctors_select_applications" ON public.applications;
DROP POLICY IF EXISTS "doctors_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "doctors_update_applications" ON public.applications;
DROP POLICY IF EXISTS "doctors_delete_applications" ON public.applications;

CREATE POLICY "doctors_select_applications" ON public.applications
  FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "doctors_insert_applications" ON public.applications
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()) 
    AND status = 'applied'
  );

CREATE POLICY "doctors_update_applications" ON public.applications
  FOR UPDATE USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()) 
    AND (
      status IS NOT DISTINCT FROM (
        SELECT status FROM public.applications WHERE id = public.applications.id
      ) 
      OR status = 'applied'
    )
  );

CREATE POLICY "doctors_delete_applications" ON public.applications
  FOR DELETE USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));


-- 6. Tighten RLS on public.professional_applications (Prevents self-confirmation)
ALTER TABLE public.professional_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professionals_own_applications" ON public.professional_applications;
DROP POLICY IF EXISTS "professionals_select_applications" ON public.professional_applications;
DROP POLICY IF EXISTS "professionals_insert_applications" ON public.professional_applications;
DROP POLICY IF EXISTS "professionals_update_applications" ON public.professional_applications;
DROP POLICY IF EXISTS "professionals_delete_applications" ON public.professional_applications;

CREATE POLICY "professionals_select_applications" ON public.professional_applications
  FOR SELECT USING (professional_id IN (SELECT id FROM public.healthcare_professionals WHERE user_id = auth.uid()));

CREATE POLICY "professionals_insert_applications" ON public.professional_applications
  FOR INSERT WITH CHECK (
    professional_id IN (SELECT id FROM public.healthcare_professionals WHERE user_id = auth.uid()) 
    AND status = 'applied'
  );

CREATE POLICY "professionals_update_applications" ON public.professional_applications
  FOR UPDATE USING (professional_id IN (SELECT id FROM public.healthcare_professionals WHERE user_id = auth.uid()))
  WITH CHECK (
    professional_id IN (SELECT id FROM public.healthcare_professionals WHERE user_id = auth.uid()) 
    AND (
      status IS NOT DISTINCT FROM (
        SELECT status FROM public.professional_applications WHERE id = public.professional_applications.id
      ) 
      OR status = 'applied'
    )
  );

CREATE POLICY "professionals_delete_applications" ON public.professional_applications
  FOR DELETE USING (professional_id IN (SELECT id FROM public.healthcare_professionals WHERE user_id = auth.uid()));
