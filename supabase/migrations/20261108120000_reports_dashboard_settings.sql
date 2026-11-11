-- Migration: 20261108120000_reports_dashboard_settings.sql
-- Kebutuhan: M4B — Laporan, Dasbor, Pengaturan & Log Aktivitas (PRD §8.9, §8.10, §8.11, §8.12, §11.4, §12.2, §13.3)

-- 1. Tabel library_settings (PRD §11.4 & FR-SET-02)
create table public.library_settings (
  id smallint primary key default 1 check (id = 1),
  school_name text not null default 'SMKN 1 Selayar',
  library_name text not null default 'Perpustakaan SMKN 1 Selayar',
  address text not null default 'Jl. Pahlawan No. 1, Benteng, Kepulauan Selayar',
  logo_path text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create trigger trg_library_settings_updated_at
  before update on public.library_settings
  for each row execute function private.set_updated_at();

-- Seed baris default (id = 1)
insert into public.library_settings (id, school_name, library_name, address, logo_path)
values (1, 'SMKN 1 Selayar', 'Perpustakaan SMKN 1 Selayar', 'Jl. Pahlawan No. 1, Benteng, Kepulauan Selayar', null)
on conflict (id) do nothing;

-- RLS: library_settings (PRD §13.3)
alter table public.library_settings enable row level security;

create policy "library_settings_select_authenticated"
  on public.library_settings for select
  to authenticated
  using (true);

create policy "library_settings_update_librarian"
  on public.library_settings for update
  to authenticated
  using ((select private.is_librarian()))
  with check ((select private.is_librarian()));

-- 2. Storage Bucket library-assets (PRD §11.7, §13.4 & FR-SET-02)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library-assets', 'library-assets', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Library assets bucket is public readable"
  on storage.objects for select
  to public
  using (bucket_id = 'library-assets');

create policy "Librarians can upload library assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'library-assets'
    and (select private.is_librarian())
  );

create policy "Librarians can update library assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'library-assets'
    and (select private.is_librarian())
  );

create policy "Librarians can delete library assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'library-assets'
    and (select private.is_librarian())
  );

-- 3. Trigger log audit pembaruan kebijakan pinjam (PRD §12.2)
create or replace function private.trg_loan_policies_log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.log_activity(
    'policy.updated',
    'policy',
    new.role::text,
    jsonb_build_object(
      'role', new.role,
      'old', jsonb_build_object(
        'max_active_loans', old.max_active_loans,
        'loan_days', old.loan_days,
        'daily_fine', old.daily_fine,
        'pickup_days', old.pickup_days
      ),
      'new', jsonb_build_object(
        'max_active_loans', new.max_active_loans,
        'loan_days', new.loan_days,
        'daily_fine', new.daily_fine,
        'pickup_days', new.pickup_days
      )
    )
  );
  return new;
end;
$$;

create or replace trigger trg_loan_policies_activity_log
  after update on public.loan_policies
  for each row execute function private.trg_loan_policies_log_activity();

-- 4. RPC get_librarian_dashboard (FR-DSH-02, TC-DSH-02)
create or replace function public.get_librarian_dashboard()
returns jsonb
language plpgsql
security invoker
set search_path = ''
stable
as $$
declare
  v_res jsonb;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'pending_requests', (select count(*)::integer from public.loan_requests where status = 'pending'),
    'ready_pickups', (select count(*)::integer from public.loan_requests where status = 'approved'),
    'active_loans', (select count(*)::integer from public.loans where status = 'active'),
    'overdue_loans', (select count(*)::integer from public.loans where status = 'active' and due_date < private.today_wita()),
    'pending_returns', (select count(*)::integer from public.loans where status = 'active' and return_requested_at is not null),
    'unpaid_fines_total', (select coalesce(sum(amount), 0)::bigint from public.fines where status = 'unpaid'),
    'unpaid_fines_count', (select count(*)::integer from public.fines where status = 'unpaid')
  ) into v_res;

  return v_res;
end;
$$;

revoke execute on function public.get_librarian_dashboard() from public, anon;
grant execute on function public.get_librarian_dashboard() to authenticated;

-- 5. RPC report_loans (FR-RPT-01, TC-RPT-01)
create or replace function public.report_loans(p_from date, p_to date)
returns table (
  loan_id bigint,
  loaned_at timestamptz,
  member_name text,
  member_code text,
  class_name text,
  title text,
  copy_code text,
  due_date date,
  returned_at timestamptz,
  status public.loan_status
)
language plpgsql
security invoker
set search_path = ''
stable
as $$
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  return query
  select
    l.id as loan_id,
    l.loaned_at,
    p.full_name as member_name,
    p.member_code,
    p.class_name,
    b.title,
    c.code as copy_code,
    l.due_date,
    l.returned_at,
    l.status
  from public.loans l
  join public.profiles p on p.id = l.member_id
  join public.book_copies c on c.id = l.copy_id
  join public.books b on b.id = c.book_id
  where (l.loaned_at at time zone 'Asia/Makassar')::date between p_from and p_to
  order by l.loaned_at desc, l.id desc;
end;
$$;

revoke execute on function public.report_loans(date, date) from public, anon;
grant execute on function public.report_loans(date, date) to authenticated;

-- 6. RPC report_returns (FR-RPT-02)
create or replace function public.report_returns(p_from date, p_to date)
returns table (
  loan_id bigint,
  loaned_at timestamptz,
  returned_at timestamptz,
  member_name text,
  member_code text,
  class_name text,
  title text,
  copy_code text,
  due_date date,
  days_overdue integer,
  fine_amount integer,
  fine_status public.fine_status
)
language plpgsql
security invoker
set search_path = ''
stable
as $$
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  return query
  select
    l.id as loan_id,
    l.loaned_at,
    l.returned_at,
    p.full_name as member_name,
    p.member_code,
    p.class_name,
    b.title,
    c.code as copy_code,
    l.due_date,
    greatest(0, ((l.returned_at at time zone 'Asia/Makassar')::date - l.due_date))::integer as days_overdue,
    coalesce(f.total_fine, 0)::integer as fine_amount,
    f.status as fine_status
  from public.loans l
  join public.profiles p on p.id = l.member_id
  join public.book_copies c on c.id = l.copy_id
  join public.books b on b.id = c.book_id
  left join lateral (
    select
      sum(fn.amount)::integer as total_fine,
      case
        when bool_or(fn.status = 'unpaid') then 'unpaid'::public.fine_status
        when bool_or(fn.status = 'paid') then 'paid'::public.fine_status
        when bool_or(fn.status = 'waived') then 'waived'::public.fine_status
        else null
      end as status
    from public.fines fn
    where fn.loan_id = l.id
  ) f on true
  where l.returned_at is not null
    and (l.returned_at at time zone 'Asia/Makassar')::date between p_from and p_to
  order by l.returned_at desc, l.id desc;
end;
$$;

revoke execute on function public.report_returns(date, date) from public, anon;
grant execute on function public.report_returns(date, date) to authenticated;

-- 7. RPC report_overdue (FR-RPT-03, TC-RPT-03)
create or replace function public.report_overdue(p_as_of date default null)
returns table (
  loan_id bigint,
  member_name text,
  member_code text,
  class_name text,
  title text,
  copy_code text,
  loaned_at timestamptz,
  due_date date,
  days_overdue integer,
  daily_fine_snapshot integer,
  estimated_fine integer
)
language plpgsql
security invoker
set search_path = ''
stable
as $$
declare
  v_as_of date;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  v_as_of := coalesce(p_as_of, private.today_wita());

  return query
  select
    l.id as loan_id,
    p.full_name as member_name,
    p.member_code,
    p.class_name,
    b.title,
    c.code as copy_code,
    l.loaned_at,
    l.due_date,
    (v_as_of - l.due_date)::integer as days_overdue,
    l.daily_fine_snapshot,
    ((v_as_of - l.due_date) * l.daily_fine_snapshot)::integer as estimated_fine
  from public.loans l
  join public.profiles p on p.id = l.member_id
  join public.book_copies c on c.id = l.copy_id
  join public.books b on b.id = c.book_id
  where l.status = 'active'
    and l.due_date < v_as_of
  order by days_overdue desc, l.due_date asc, l.id asc;
end;
$$;

revoke execute on function public.report_overdue(date) from public, anon;
grant execute on function public.report_overdue(date) to authenticated;

-- 8. RPC report_fines (FR-RPT-04, TC-RPT-04)
create or replace function public.report_fines(p_from date, p_to date)
returns table (
  fine_id bigint,
  loan_id bigint,
  created_at timestamptz,
  member_name text,
  member_code text,
  class_name text,
  title text,
  type public.fine_type,
  amount integer,
  status public.fine_status,
  paid_at timestamptz,
  waived_at timestamptz,
  waived_reason text
)
language plpgsql
security invoker
set search_path = ''
stable
as $$
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  return query
  select
    f.id as fine_id,
    f.loan_id,
    f.created_at,
    p.full_name as member_name,
    p.member_code,
    p.class_name,
    b.title,
    f.type,
    f.amount,
    f.status,
    f.paid_at,
    f.waived_at,
    f.waived_reason
  from public.fines f
  join public.loans l on l.id = f.loan_id
  join public.profiles p on p.id = f.member_id
  join public.book_copies c on c.id = l.copy_id
  join public.books b on b.id = c.book_id
  where (f.created_at at time zone 'Asia/Makassar')::date between p_from and p_to
  order by f.created_at desc, f.id desc;
end;
$$;

revoke execute on function public.report_fines(date, date) from public, anon;
grant execute on function public.report_fines(date, date) to authenticated;

-- 9. RPC report_inventory (FR-RPT-05, TC-RPT-05)
create or replace function public.report_inventory()
returns table (
  book_id bigint,
  title text,
  isbn text,
  category_name text,
  authors text,
  total_copies integer,
  available_copies integer,
  on_loan_copies integer,
  reserved_copies integer,
  damaged_copies integer,
  lost_copies integer,
  withdrawn_copies integer
)
language plpgsql
security invoker
set search_path = ''
stable
as $$
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  return query
  select
    b.id as book_id,
    b.title,
    b.isbn,
    c.name as category_name,
    b.authors,
    count(bc.id)::integer as total_copies,
    count(bc.id) filter (where bc.status = 'available')::integer as available_copies,
    count(bc.id) filter (where bc.status = 'on_loan')::integer as on_loan_copies,
    count(bc.id) filter (where bc.status = 'reserved')::integer as reserved_copies,
    count(bc.id) filter (where bc.status = 'damaged')::integer as damaged_copies,
    count(bc.id) filter (where bc.status = 'lost')::integer as lost_copies,
    count(bc.id) filter (where bc.status = 'withdrawn')::integer as withdrawn_copies
  from public.books b
  join public.categories c on c.id = b.category_id
  left join public.book_copies bc on bc.book_id = b.id
  group by b.id, b.title, b.isbn, c.name, b.authors
  order by c.name asc, b.title asc;
end;
$$;

revoke execute on function public.report_inventory() from public, anon;
grant execute on function public.report_inventory() to authenticated;

-- 10. RPC report_member_activity (FR-RPT-06)
create or replace function public.report_member_activity(p_from date, p_to date)
returns table (
  member_id uuid,
  member_code text,
  full_name text,
  role public.user_role,
  class_name text,
  total_loans integer,
  returned_loans integer,
  overdue_loans integer
)
language plpgsql
security invoker
set search_path = ''
stable
as $$
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  return query
  select
    p.id as member_id,
    p.member_code,
    p.full_name,
    p.role,
    p.class_name,
    count(l.id)::integer as total_loans,
    count(l.id) filter (where l.status = 'returned')::integer as returned_loans,
    count(l.id) filter (
      where (l.returned_at is not null and (l.returned_at at time zone 'Asia/Makassar')::date > l.due_date)
         or (l.status = 'active' and l.due_date < private.today_wita())
    )::integer as overdue_loans
  from public.profiles p
  join public.loans l on l.member_id = p.id
  where (l.loaned_at at time zone 'Asia/Makassar')::date between p_from and p_to
  group by p.id, p.member_code, p.full_name, p.role, p.class_name
  order by total_loans desc, p.full_name asc;
end;
$$;

revoke execute on function public.report_member_activity(date, date) from public, anon;
grant execute on function public.report_member_activity(date, date) to authenticated;

-- 11. RPC report_popular_books (FR-RPT-07, TC-RPT-05)
create or replace function public.report_popular_books(p_from date, p_to date, p_limit int default 10)
returns table (
  book_id bigint,
  title text,
  authors text,
  category_name text,
  borrow_count bigint
)
language plpgsql
security invoker
set search_path = ''
stable
as $$
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  return query
  select
    b.id as book_id,
    b.title,
    b.authors,
    c.name as category_name,
    count(l.id)::bigint as borrow_count
  from public.loans l
  join public.book_copies bc on bc.id = l.copy_id
  join public.books b on b.id = bc.book_id
  join public.categories c on c.id = b.category_id
  where (l.loaned_at at time zone 'Asia/Makassar')::date between p_from and p_to
  group by b.id, b.title, b.authors, c.name
  order by borrow_count desc, b.title asc
  limit coalesce(p_limit, 10);
end;
$$;

revoke execute on function public.report_popular_books(date, date, int) from public, anon;
grant execute on function public.report_popular_books(date, date, int) to authenticated;
