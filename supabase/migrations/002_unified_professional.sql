-- ============================================================
-- 002_unified_professional.sql
-- Unified Healthcare Professionals, Free Jobs, Location support
-- ============================================================

-- STEP 1: Extend user_roles to support new professional roles
alter table user_roles
  drop constraint if exists user_roles_role_check;

alter table user_roles
  add constraint user_roles_role_check
  check (role in ('doctor', 'nurse', 'technician', 'clinic', 'admin'));

-- STEP 2: Unified healthcare_professionals table
create table healthcare_professionals (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users not null unique,
  role                  text not null check (role in ('doctor', 'nurse', 'technician')),
  name                  text not null,
  phone                 text not null,
  email                 text not null,
  specialty             text not null,
  experience            int not null,
  registration_number   text not null,
  city                  text not null,
  area                  text not null,
  latitude              double precision,
  longitude             double precision,
  location_display_name text,
  employment_status     text not null,
  available_days        text[] not null default '{}',
  shift_preference      text not null check (shift_preference in ('locum', 'permanent', 'both')),
  expected_pay          int not null,
  upi_id                text not null,
  verification_status   text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  verification_note     text,
  primary_cert_url      text,
  degree_cert_url       text,
  gov_id_url            text,
  created_at            timestamp with time zone default now()
);

-- STEP 3: Extend shifts to support all professional types
alter table shifts
  add column if not exists professional_type text
  not null default 'doctor'
  check (professional_type in ('doctor', 'nurse', 'technician'));

alter table shifts
  add column if not exists confirmed_professional_id uuid
  references healthcare_professionals;

-- STEP 4: Extend jobs for free posting + professional type + location + contacts
alter table jobs
  add column if not exists professional_type text
  not null default 'doctor'
  check (professional_type in ('doctor', 'nurse', 'technician'));

alter table jobs
  add column if not exists location_lat double precision;

alter table jobs
  add column if not exists location_lng double precision;

alter table jobs
  add column if not exists location_display_name text;

alter table jobs
  add column if not exists is_free_posting boolean not null default true;

alter table jobs
  add column if not exists contact_email text;

alter table jobs
  add column if not exists contact_phone text;

-- STEP 5: Unified professional_applications table
create table professional_applications (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid references healthcare_professionals not null,
  shift_id        uuid references shifts,
  job_id          uuid references jobs,
  status          text not null default 'applied'
    check (status in ('applied', 'confirmed', 'rejected', 'completed')),
  created_at      timestamp with time zone default now(),
  check (shift_id is not null or job_id is not null)
);

-- STEP 6: Professional payouts table
create table professional_payouts (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid references healthcare_professionals not null,
  shift_id        uuid references shifts not null unique,
  amount          int not null,
  upi_id          text not null,
  status          text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  paid_at         timestamp with time zone,
  created_at      timestamp with time zone default now()
);

-- STEP 7: RLS policies for all new tables
alter table healthcare_professionals     enable row level security;
alter table professional_applications    enable row level security;
alter table professional_payouts         enable row level security;

-- Professionals can manage their own profile
create policy "professionals_own_profile" on healthcare_professionals
  for all using (auth.uid() = user_id);

-- Active shifts visible to all authenticated professionals
create policy "active_shifts_visible_to_professionals" on shifts
  for select using (status = 'active');

-- Professionals can manage their own applications
create policy "professionals_own_applications" on professional_applications
  for all using (
    professional_id in (
      select id from healthcare_professionals where user_id = auth.uid()
    )
  );

-- Clinics can read applications for their own shifts and jobs
create policy "clinics_read_professional_applications" on professional_applications
  for select using (
    shift_id in (
      select id from shifts where clinic_id in (
        select id from clinics where user_id = auth.uid()
      )
    )
    or job_id in (
      select id from jobs where clinic_id in (
        select id from clinics where user_id = auth.uid()
      )
    )
  );

-- Professionals can read their own payouts
create policy "professionals_read_own_payouts" on professional_payouts
  for select using (
    professional_id in (
      select id from healthcare_professionals where user_id = auth.uid()
    )
  );

-- Clinics can read payouts for shifts they own
create policy "clinics_read_professional_payouts" on professional_payouts
  for select using (
    shift_id in (
      select id from shifts where clinic_id in (
        select id from clinics where user_id = auth.uid()
      )
    )
  );
