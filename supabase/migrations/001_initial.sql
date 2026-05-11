-- User roles table
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  role text not null check (role in ('doctor', 'clinic', 'admin')),
  created_at timestamp with time zone default now()
);

-- Doctors table
create table doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  name text not null,
  phone text not null,
  email text not null,
  specialty text not null,
  experience int not null,
  mci_number text not null,
  city text not null,
  area text not null,
  employment_status text not null,
  available_days text[] not null default '{}',
  shift_preference text not null,
  expected_pay int not null,
  upi_id text not null,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  verification_note text,
  mci_cert_url text,
  degree_cert_url text,
  gov_id_url text,
  created_at timestamp with time zone default now()
);

-- Clinics table
create table clinics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  name text not null,
  type text not null,
  address text not null,
  area text not null,
  phone text not null,
  contact_person text not null,
  contact_phone text not null,
  specialties_needed text[] not null default '{}',
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  reg_cert_url text,
  created_at timestamp with time zone default now()
);

-- Shifts table
create table shifts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics not null,
  specialty text not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  pay int not null,
  area text not null,
  notes text,
  is_urgent boolean default false,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'active', 'confirmed', 'completed', 'cancelled')),
  razorpay_payment_id text,
  confirmed_doctor_id uuid references doctors,
  created_at timestamp with time zone default now()
);

-- Jobs table
create table jobs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics not null,
  specialty text not null,
  experience_min int not null,
  job_type text not null check (job_type in ('full_time', 'part_time')),
  salary_min int not null,
  salary_max int not null,
  description text not null,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamp with time zone default now()
);

-- Applications table
create table applications (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references doctors not null,
  shift_id uuid references shifts,
  job_id uuid references jobs,
  status text not null default 'applied' check (status in ('applied', 'confirmed', 'rejected', 'completed')),
  created_at timestamp with time zone default now(),
  check (shift_id is not null or job_id is not null)
);

-- Clinic payments table
create table clinic_payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics not null,
  shift_id uuid references shifts not null unique,
  amount int not null,
  razorpay_id text not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default now()
);

-- Doctor payouts table
create table doctor_payouts (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references doctors not null,
  shift_id uuid references shifts not null unique,
  amount int not null,
  upi_id text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- RLS Policies
alter table user_roles enable row level security;
alter table doctors enable row level security;
alter table clinics enable row level security;
alter table shifts enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;
alter table clinic_payments enable row level security;
alter table doctor_payouts enable row level security;

-- Users can read and write their own role during auth onboarding
create policy "user_roles_own_select" on user_roles
  for select using (auth.uid() = user_id);

create policy "user_roles_own_insert" on user_roles
  for insert with check (auth.uid() = user_id);

create policy "user_roles_own_update" on user_roles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Doctors can only read and update their own profile
create policy "doctors_own_profile" on doctors
  for all using (auth.uid() = user_id);

-- Clinics can only read and update their own profile
create policy "clinics_own_profile" on clinics
  for all using (auth.uid() = user_id);

-- Active shifts are visible to all verified doctors
create policy "shifts_visible_to_doctors" on shifts
  for select using (status = 'active');

-- Clinics can manage their own shifts
create policy "clinics_manage_shifts" on shifts
  for all using (clinic_id in (select id from clinics where user_id = auth.uid()));

-- Active jobs visible to all
create policy "jobs_visible_to_all" on jobs
  for select using (status = 'active');

-- Clinics manage their own jobs
create policy "clinics_manage_jobs" on jobs
  for all using (clinic_id in (select id from clinics where user_id = auth.uid()));

-- Doctors manage their own applications
create policy "doctors_own_applications" on applications
  for all using (doctor_id in (select id from doctors where user_id = auth.uid()));

-- Clinics can read applications for their own shifts and jobs
create policy "clinics_read_applications" on applications
  for select using (
    shift_id in (select id from shifts where clinic_id in (select id from clinics where user_id = auth.uid()))
    or job_id in (select id from jobs where clinic_id in (select id from clinics where user_id = auth.uid()))
  );

-- Clinics can read their payments; doctors can read their payouts
create policy "clinics_read_payments" on clinic_payments
  for select using (clinic_id in (select id from clinics where user_id = auth.uid()));

create policy "doctors_read_payouts" on doctor_payouts
  for select using (doctor_id in (select id from doctors where user_id = auth.uid()));
