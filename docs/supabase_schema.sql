-- ========================================================================
-- ZIVARO DATABASE MIGRATION SCHEMA DDL
-- ========================================================================

-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Extends auth.users for Student & Provider metadata)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('student', 'provider')) not null default 'student',
  name text,
  onboarding_completed boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- RLS Policies for Profiles
create policy "Profiles are viewable by authenticated users." 
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Users can update their own profile." 
  on public.profiles for update using (auth.uid() = id);

-- 2. JOBS TABLE (Hustle Opportunities)
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  business_name text not null,
  description text,
  payout integer not null,
  payout_type text check (payout_type in ('hr', 'shift', 'month', 'task')) not null,
  is_urgent boolean default false,
  is_premium boolean default false,
  is_verified boolean default false,
  location text,
  distance text,
  timing text,
  posted_time text,
  tags text[],
  logo_placeholder text,
  provider_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Jobs
alter table public.jobs enable row level security;

-- RLS Policies for Jobs
create policy "Jobs are readable by all authenticated users." 
  on public.jobs for select using (auth.role() = 'authenticated');

create policy "Providers can manage their own posted jobs." 
  on public.jobs for all using (auth.uid() = provider_id);

-- 3. APPLICATIONS TABLE (Shift hiring pipes)
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('applied', 'viewed', 'accepted', 'rejected')) not null default 'applied',
  applied_date text,
  response_estimate text,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Applications
alter table public.applications enable row level security;

-- RLS Policies for Applications
create policy "Students can view and manage their own applications." 
  on public.applications for all using (auth.uid() = student_id);

create policy "Providers can view applications for their posted jobs." 
  on public.applications for select using (
    exists (
      select 1 from public.jobs 
      where jobs.id = applications.job_id 
      and jobs.provider_id = auth.uid()
    )
  );

create policy "Providers can update application status for their posted jobs." 
  on public.applications for update using (
    exists (
      select 1 from public.jobs 
      where jobs.id = applications.job_id 
      and jobs.provider_id = auth.uid()
    )
  );

-- 4. SAVED JOBS TABLE (Student Bookmarks)
create table if not exists public.saved_jobs (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, job_id)
);

-- Enable RLS for Saved Jobs
alter table public.saved_jobs enable row level security;

-- RLS Policies for Saved Jobs
create policy "Users can manage their saved jobs list." 
  on public.saved_jobs for all using (auth.uid() = student_id);

-- 5. MESSAGES TABLE (Realtime Chat conversations)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Messages
alter table public.messages enable row level security;

-- RLS Policies for Messages
create policy "Users can send and view their own chat histories." 
  on public.messages for all using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- 6. REVIEWS TABLE (Platform feedback rating tracks)
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  reviewer_id uuid references public.profiles(id) on delete cascade,
  reviewee_id uuid references public.profiles(id) on delete cascade,
  rating numeric check (rating >= 1 and rating <= 5) not null,
  tags text[],
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Reviews
alter table public.reviews enable row level security;

-- RLS Policies for Reviews
create policy "Reviews are viewable by authenticated users." 
  on public.reviews for select using (auth.role() = 'authenticated');

create policy "Users can submit reviewer entries." 
  on public.reviews for insert with check (auth.uid() = reviewer_id);

-- 7. NOTIFICATIONS TABLE (Centralized Activity updates)
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  content text not null,
  is_read boolean default false,
  is_important boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Notifications
alter table public.notifications enable row level security;

-- RLS Policies for Notifications
create policy "Users can view and manage their own notifications." 
  on public.notifications for all using (auth.uid() = user_id);


-- ========================================================================
-- AUTOMATIC PROFILE ROW SYNC TRIGGER
-- ========================================================================

-- Trigger function to automatically spawn public profile record upon Auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, onboarding_completed, metadata)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce((new.raw_user_meta_data->>'onboarding_completed')::boolean, false),
    coalesce(new.raw_user_meta_data->'metadata', '{}'::jsonb)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger execution to auth.users inserts
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========================================================================
-- RPC TO CHECK IF EMAIL EXISTS IN AUTH.USERS (Bypasses RLS securely)
-- ========================================================================
create or replace function public.check_user_exists(email_to_check text)
returns boolean as $$
begin
  return exists (
    select 1 from auth.users where email = email_to_check
  );
end;
$$ language plpgsql security definer;
