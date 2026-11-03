-- Migration: 20261103033302_auth_members.sql
-- Modul: AUTH & MBR (Milestone M1)

-- 1. Skema dan Enum
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.app_role as enum ('student', 'teacher', 'librarian');

-- 2. Tabel majors (Jurusan)
create table public.majors (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabel profiles (Identitas Terpadu)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  member_code text not null unique,
  login_id text generated always as (lower(regexp_replace(member_code, '[^A-Za-z0-9]', '', 'g'))) stored unique,
  full_name text not null,
  role public.app_role not null,
  class_name text,
  major_id bigint references public.majors(id) on delete restrict,
  subject text,
  position text,
  phone text,
  photo_path text,
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_login_id_len check (length(login_id) between 3 and 30),
  constraint profiles_full_name_len check (length(full_name) between 2 and 100),
  constraint profiles_student_class check (role != 'student' or class_name is not null)
);

-- Indeks profiles
create index idx_profiles_role_active on public.profiles(role, is_active);
create index idx_profiles_class_name on public.profiles(class_name);
create index idx_profiles_major_id on public.profiles(major_id);

-- 4. Tabel activity_logs (Log Aktivitas Audit)
create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indeks activity_logs
create index idx_activity_logs_created_at on public.activity_logs(created_at desc);
create index idx_activity_logs_actor_id on public.activity_logs(actor_id);

-- 5. Tabel loan_policies (Kebijakan Pinjam)
create table public.loan_policies (
  role public.app_role primary key check (role in ('student', 'teacher')),
  max_active_loans smallint not null check (max_active_loans between 1 and 20),
  loan_days smallint not null check (loan_days between 1 and 90),
  daily_fine integer not null check (daily_fine between 0 and 100000),
  pickup_days smallint not null check (pickup_days between 1 and 14),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete restrict
);

-- Data awal kebijakan pinjam (PRD A-06)
insert into public.loan_policies (role, max_active_loans, loan_days, daily_fine, pickup_days)
values
  ('student', 5, 7, 500, 2),
  ('teacher', 5, 14, 500, 2);

-- 6. Fungsi Helper di Skema private
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_majors_updated_at
  before update on public.majors
  for each row execute function private.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger trg_loan_policies_updated_at
  before update on public.loan_policies
  for each row execute function private.set_updated_at();

create or replace function private.today_wita()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Makassar')::date;
$$;

create or replace function private.is_librarian()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'librarian'
      and is_active = true
  );
$$;

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
    and is_active = true;
$$;

create or replace function private.log_activity(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    (select auth.uid()),
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

grant execute on function private.is_librarian() to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.today_wita() to authenticated;

-- 7. Trigger Pembuatan Profil Otomatis saat User Terdaftar di auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
  v_member_code text;
  v_full_name text;
  v_class_name text;
  v_major_id bigint;
  v_subject text;
  v_position text;
  v_phone text;
  v_must_change_password boolean;
begin
  v_role := coalesce(new.raw_app_meta_data->>'role', new.raw_user_meta_data->>'role')::public.app_role;
  v_member_code := coalesce(new.raw_user_meta_data->>'member_code', new.raw_app_meta_data->>'member_code');
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_app_meta_data->>'full_name');
  v_class_name := new.raw_user_meta_data->>'class_name';
  v_major_id := (new.raw_user_meta_data->>'major_id')::bigint;
  v_subject := new.raw_user_meta_data->>'subject';
  v_position := new.raw_user_meta_data->>'position';
  v_phone := new.raw_user_meta_data->>'phone';
  v_must_change_password := coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, true);

  insert into public.profiles (
    id,
    member_code,
    full_name,
    role,
    class_name,
    major_id,
    subject,
    position,
    phone,
    must_change_password
  ) values (
    new.id,
    v_member_code,
    v_full_name,
    v_role,
    v_class_name,
    v_major_id,
    v_subject,
    v_position,
    v_phone,
    v_must_change_password
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. RPC complete_password_change()
create or replace function public.complete_password_change()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  perform set_config('app.completing_password_change', 'true', true);

  update public.profiles
  set must_change_password = false
  where id = v_uid;
end;
$$;

revoke execute on function public.complete_password_change() from public, anon;
grant execute on function public.complete_password_change() to authenticated;

-- 9. Aturan Update Profil (BR-15 dan pembatasan self-update)
create or replace function private.enforce_profile_update_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_is_librarian boolean;
begin
  -- Pengecualian khusus bila dijalankan dari RPC complete_password_change
  if current_setting('app.completing_password_change', true) = 'true' then
    return new;
  end if;

  -- Kunci nomor induk dan peran sesuai BR-15
  if new.id != old.id or new.member_code != old.member_code or new.role != old.role then
    raise exception 'FORBIDDEN' using errcode = 'P0001', detail = 'Nomor induk dan peran tidak dapat diubah (BR-15)';
  end if;

  v_is_librarian := (select private.is_librarian());

  -- Pengguna non-pustakawan hanya dapat mengubah nomor telepon
  if not v_is_librarian then
    if new.full_name != old.full_name
      or new.class_name is distinct from old.class_name
      or new.major_id is distinct from old.major_id
      or new.subject is distinct from old.subject
      or new.position is distinct from old.position
      or new.photo_path is distinct from old.photo_path
      or new.is_active != old.is_active
      or new.must_change_password != old.must_change_password
    then
      raise exception 'FORBIDDEN' using errcode = 'P0001', detail = 'Pengguna hanya diizinkan mengubah kontak telepon sendiri';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_profile_update_rules
  before update on public.profiles
  for each row execute function private.enforce_profile_update_rules();

-- 10. Kebijakan Row Level Security (RLS)
alter table public.majors enable row level security;
alter table public.profiles enable row level security;
alter table public.activity_logs enable row level security;
alter table public.loan_policies enable row level security;

-- RLS: majors
create policy "majors_select_authenticated"
  on public.majors for select
  to authenticated
  using (true);

create policy "majors_insert_librarian"
  on public.majors for insert
  to authenticated
  with check ((select private.is_librarian()));

create policy "majors_update_librarian"
  on public.majors for update
  to authenticated
  using ((select private.is_librarian()))
  with check ((select private.is_librarian()));

create policy "majors_delete_librarian"
  on public.majors for delete
  to authenticated
  using ((select private.is_librarian()));

-- RLS: profiles
create policy "profiles_select_own_or_librarian"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_librarian())
  );

create policy "profiles_update_policy"
  on public.profiles for update
  to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_librarian())
  )
  with check (
    id = (select auth.uid())
    or (select private.is_librarian())
  );

-- RLS: activity_logs
create policy "activity_logs_select_librarian"
  on public.activity_logs for select
  to authenticated
  using ((select private.is_librarian()));

-- RLS: loan_policies
create policy "loan_policies_select_authenticated"
  on public.loan_policies for select
  to authenticated
  using (true);

create policy "loan_policies_update_librarian"
  on public.loan_policies for update
  to authenticated
  using ((select private.is_librarian()))
  with check ((select private.is_librarian()));
