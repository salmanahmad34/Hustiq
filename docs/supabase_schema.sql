-- ========================================================================
-- ZIVARO DATABASE MIGRATION SCHEMA DDL
-- ========================================================================

-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Extends auth.users for Student & Provider metadata)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  role text check (role in ('student', 'provider')) not null default 'student',
  full_name text,
  name text, -- Kept for backward compatibility
  avatar_url text,
  bio text,
  phone text,
  onboarding_completed boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Ensure email constraint is unique (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- RLS Policies for Profiles (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'SELECT') THEN
    CREATE POLICY "SELECT" ON public.profiles FOR SELECT USING (auth.uid() is not null);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'INSERT') THEN
    CREATE POLICY "INSERT" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'UPDATE') THEN
    CREATE POLICY "UPDATE" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

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

-- RLS Policies for Jobs (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'Jobs are readable by all authenticated users.') THEN
    CREATE POLICY "Jobs are readable by all authenticated users." 
      ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'Providers can manage their own posted jobs.') THEN
    CREATE POLICY "Providers can manage their own posted jobs." 
      ON public.jobs FOR ALL USING (auth.uid() = provider_id);
  END IF;
END $$;

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

-- RLS Policies for Applications (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Students can view and manage their own applications.') THEN
    CREATE POLICY "Students can view and manage their own applications." 
      ON public.applications FOR ALL USING (auth.uid() = student_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Providers can view applications for their posted jobs.') THEN
    CREATE POLICY "Providers can view applications for their posted jobs." 
      ON public.applications FOR SELECT USING (
        exists (
          select 1 from public.jobs 
          where jobs.id = applications.job_id 
          and jobs.provider_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Providers can update application status for their posted jobs.') THEN
    CREATE POLICY "Providers can update application status for their posted jobs." 
      ON public.applications FOR UPDATE USING (
        exists (
          select 1 from public.jobs 
          where jobs.id = applications.job_id 
          and jobs.provider_id = auth.uid()
        )
      );
  END IF;
END $$;

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

-- RLS Policies for Saved Jobs (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_jobs' AND policyname = 'Users can manage their saved jobs list.') THEN
    CREATE POLICY "Users can manage their saved jobs list." 
      ON public.saved_jobs FOR ALL USING (auth.uid() = student_id);
  END IF;
END $$;

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

-- RLS Policies for Messages (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Users can send and view their own chat histories.') THEN
    CREATE POLICY "Users can send and view their own chat histories." 
      ON public.messages FOR ALL USING (auth.uid() = sender_id or auth.uid() = recipient_id);
  END IF;
END $$;

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

-- RLS Policies for Reviews (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Reviews are viewable by authenticated users.') THEN
    CREATE POLICY "Reviews are viewable by authenticated users." 
      ON public.reviews FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Users can submit reviewer entries.') THEN
    CREATE POLICY "Users can submit reviewer entries." 
      ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
  END IF;
END $$;

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

-- RLS Policies for Notifications (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can select their own notifications.') THEN
    CREATE POLICY "Users can select their own notifications." 
      ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update their own notifications.') THEN
    CREATE POLICY "Users can update their own notifications." 
      ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can delete their own notifications.') THEN
    CREATE POLICY "Users can delete their own notifications." 
      ON public.notifications FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Any authenticated user can insert notifications.') THEN
    CREATE POLICY "Any authenticated user can insert notifications." 
      ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ========================================================================
-- AUTOMATIC PROFILE ROW SYNC TRIGGER
-- ========================================================================

-- Trigger function to automatically spawn public profile record upon Auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Do not create profiles for unconfirmed users
  if new.email_confirmed_at is null then
    return new;
  end if;

  insert into public.profiles (id, email, full_name, name, role, onboarding_completed, avatar_url, bio, phone, metadata)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce((new.raw_user_meta_data->>'onboarding_completed')::boolean, false),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.raw_user_meta_data->>'bio', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->'metadata', '{}'::jsonb)
  )
  on conflict (id) do update
  set 
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger execution to auth.users inserts and updates
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- ========================================================================
-- RPC TO CHECK IF EMAIL EXISTS IN AUTH.USERS (Bypasses RLS securely)
-- ========================================================================
create or replace function public.check_user_exists(email_to_check text)
returns boolean as $$
begin
  return exists (
    select 1 from auth.users 
    where email = email_to_check 
    and email_confirmed_at is not null
  );
end;
$$ language plpgsql security definer;

-- RPC TO DETERMINE AUTHENTICATION PROVIDER OF AN EMAIL (Bypasses RLS securely)
-- ========================================================================
create or replace function public.get_user_provider(email_to_check text)
returns text as $$
declare
  user_provider text;
begin
  select i.provider into user_provider
  from auth.identities i
  join auth.users u on i.user_id = u.id
  where u.email = email_to_check
  limit 1;
  
  return user_provider;
end;
$$ language plpgsql security definer;


-- ========================================================================
-- 8. USER PUSH TOKENS TABLE (FCM Push Tokens)
-- ========================================================================
create table if not exists public.user_push_tokens (
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_push_tokens enable row level security;

-- RLS Policies for User Push Tokens (Conditional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_push_tokens' AND policyname = 'Users can manage their own push tokens.') THEN
    CREATE POLICY "Users can manage their own push tokens."
      ON public.user_push_tokens FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ========================================================================
-- 9. TRIGGERS & REALTIME FOR NOTIFICATIONS
-- ========================================================================

-- Enable realtime for the notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore error if we cannot configure publication without superuser privileges
    NULL;
END $$;

-- Function to notify all students when a new job is posted
create or replace function public.handle_new_job_posted()
returns trigger as $$
declare
  student_record record;
begin
  for student_record in 
    select id from public.profiles where role = 'student'
  loop
    insert into public.notifications (user_id, type, title, content, is_important, metadata)
    values (
      student_record.id,
      'system',
      'New Nearby Job Posted! 📍',
      'A new gig "' || new.title || '" is available near your location.',
      new.is_urgent,
      jsonb_build_object('jobId', new.id, 'actionPath', '/dashboard', 'actionText', 'View Gig')
    );
  end loop;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_job_posted on public.jobs;
create trigger on_job_posted
  after insert on public.jobs
  for each row execute procedure public.handle_new_job_posted();

