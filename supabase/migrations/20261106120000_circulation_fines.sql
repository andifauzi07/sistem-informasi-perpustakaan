-- Migration: 20261106120000_circulation_fines.sql
-- Modul: CIR (Sirkulasi) & FIN (Denda) (Milestone M3)

-- 1. Tipe Enum Sirkulasi & Denda (PRD §11.3)
create type public.loan_request_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'expired',
  'fulfilled'
);

create type public.loan_status as enum (
  'active',
  'returned',
  'lost'
);

create type public.fine_type as enum (
  'late',
  'damage',
  'loss'
);

create type public.fine_status as enum (
  'unpaid',
  'paid',
  'waived'
);

-- 2. Tabel loan_requests (Pengajuan Peminjaman — PRD §11.4)
create table public.loan_requests (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.profiles(id) on delete restrict,
  book_id bigint not null references public.books(id) on delete restrict,
  status public.loan_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete restrict,
  reject_reason text,
  reserved_copy_id bigint references public.book_copies(id) on delete restrict,
  pickup_deadline timestamptz,
  closed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loan_requests_rejected_reason_check check (
    status != 'rejected' or (reject_reason is not null and length(trim(reject_reason)) > 0)
  ),
  constraint loan_requests_approved_allocation_check check (
    status != 'approved' or (reserved_copy_id is not null and pickup_deadline is not null)
  )
);

-- Indeks unik parsial & reguler loan_requests (PRD §11.4 & §11.6)
create unique index idx_loan_requests_member_book_open
  on public.loan_requests(member_id, book_id)
  where status in ('pending', 'approved');

create unique index idx_loan_requests_reserved_copy
  on public.loan_requests(reserved_copy_id)
  where status = 'approved';

create index idx_loan_requests_status_requested_at
  on public.loan_requests(status, requested_at);

create index idx_loan_requests_member_id
  on public.loan_requests(member_id);

create index idx_loan_requests_book_id
  on public.loan_requests(book_id);

create trigger trg_loan_requests_updated_at
  before update on public.loan_requests
  for each row execute function private.set_updated_at();

-- 3. Tabel loans (Transaksi Peminjaman — PRD §11.4)
create table public.loans (
  id bigint generated always as identity primary key,
  copy_id bigint not null references public.book_copies(id) on delete restrict,
  member_id uuid not null references public.profiles(id) on delete restrict,
  request_id bigint unique references public.loan_requests(id) on delete restrict,
  status public.loan_status not null default 'active',
  loaned_at timestamptz not null default now(),
  due_date date not null,
  daily_fine_snapshot integer not null check (daily_fine_snapshot >= 0),
  checked_out_by uuid not null references public.profiles(id) on delete restrict,
  return_requested_at timestamptz,
  returned_at timestamptz,
  checked_in_by uuid references public.profiles(id) on delete restrict,
  return_condition text check (return_condition in ('good', 'damaged')),
  lost_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loans_returned_fields_check check (
    status != 'returned' or (returned_at is not null and checked_in_by is not null)
  ),
  constraint loans_lost_fields_check check (
    status != 'lost' or lost_at is not null
  )
);

-- Indeks unik parsial & reguler loans (PRD §11.4 & §11.6)
create unique index idx_loans_active_copy
  on public.loans(copy_id)
  where status = 'active';

create index idx_loans_member_status
  on public.loans(member_id, status);

create index idx_loans_status_due_date
  on public.loans(status, due_date);

create index idx_loans_copy_id
  on public.loans(copy_id);

create trigger trg_loans_updated_at
  before update on public.loans
  for each row execute function private.set_updated_at();

-- 4. Tabel fines (Tagihan Denda — PRD §11.4)
create table public.fines (
  id bigint generated always as identity primary key,
  loan_id bigint not null references public.loans(id) on delete restrict,
  member_id uuid not null references public.profiles(id) on delete restrict,
  type public.fine_type not null,
  days_late integer,
  amount integer not null check (amount > 0),
  status public.fine_status not null default 'unpaid',
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete restrict,
  paid_at timestamptz,
  received_by uuid references public.profiles(id) on delete restrict,
  waived_at timestamptz,
  waived_by uuid references public.profiles(id) on delete restrict,
  waived_reason text,
  updated_at timestamptz not null default now(),
  constraint fines_loan_type_unique unique (loan_id, type),
  constraint fines_late_days_check check (
    type != 'late' or (days_late is not null and days_late >= 1)
  ),
  constraint fines_paid_fields_check check (
    status != 'paid' or (paid_at is not null and received_by is not null)
  ),
  constraint fines_waived_fields_check check (
    status != 'waived' or (
      waived_at is not null
      and waived_by is not null
      and waived_reason is not null
      and length(trim(waived_reason)) > 0
    )
  )
);

-- Indeks fines (PRD §11.6)
create index idx_fines_member_status
  on public.fines(member_id, status);

create index idx_fines_status_created_at
  on public.fines(status, created_at desc);

create index idx_fines_loan_id
  on public.fines(loan_id);

create trigger trg_fines_updated_at
  before update on public.fines
  for each row execute function private.set_updated_at();

-- 5. View v_loans (PRD §11.5)
create or replace view public.v_loans
with (security_invoker = true) as
select
  l.id,
  l.copy_id,
  l.member_id,
  l.request_id,
  l.status,
  l.loaned_at,
  l.due_date,
  l.daily_fine_snapshot,
  l.checked_out_by,
  l.return_requested_at,
  l.returned_at,
  l.checked_in_by,
  l.return_condition,
  l.lost_at,
  l.notes,
  l.created_at,
  l.updated_at,
  p.member_code,
  p.full_name,
  p.class_name,
  p.role,
  b.id as book_id,
  b.title,
  b.authors,
  b.cover_path,
  c.code as copy_code,
  (l.status = 'active' and private.today_wita() > l.due_date) as is_overdue,
  greatest(
    0,
    (
      case
        when l.status = 'active' then private.today_wita()
        when l.status = 'returned' and l.returned_at is not null then (l.returned_at at time zone 'Asia/Makassar')::date
        when l.status = 'lost' and l.lost_at is not null then (l.lost_at at time zone 'Asia/Makassar')::date
        else private.today_wita()
      end - l.due_date
    )
  )::integer as days_overdue,
  (
    greatest(
      0,
      (
        case
          when l.status = 'active' then private.today_wita()
          when l.status = 'returned' and l.returned_at is not null then (l.returned_at at time zone 'Asia/Makassar')::date
          when l.status = 'lost' and l.lost_at is not null then (l.lost_at at time zone 'Asia/Makassar')::date
          else private.today_wita()
        end - l.due_date
      )
    ) * l.daily_fine_snapshot
  )::integer as estimated_fine
from public.loans l
join public.profiles p on p.id = l.member_id
join public.book_copies c on c.id = l.copy_id
join public.books b on b.id = c.book_id;

-- 6. Kebijakan RLS Sirkulasi & Denda (PRD §13.3)
alter table public.loan_requests enable row level security;

create policy "Loan requests select for owner or librarian"
  on public.loan_requests for select
  to authenticated
  using (
    member_id = (select auth.uid())
    or (select private.is_librarian())
  );

revoke insert, update, delete on public.loan_requests from anon, authenticated;
grant select on public.loan_requests to authenticated;

alter table public.loans enable row level security;

create policy "Loans select for owner or librarian"
  on public.loans for select
  to authenticated
  using (
    member_id = (select auth.uid())
    or (select private.is_librarian())
  );

revoke insert, update, delete on public.loans from anon, authenticated;
grant select on public.loans to authenticated;
grant select on public.v_loans to authenticated;

alter table public.fines enable row level security;

create policy "Fines select for owner or librarian"
  on public.fines for select
  to authenticated
  using (
    member_id = (select auth.uid())
    or (select private.is_librarian())
  );

revoke insert, update, delete on public.fines from anon, authenticated;
grant select on public.fines to authenticated;

-- 7. Fungsi RPC Sirkulasi & Denda (PRD §12.2)

-- 7.1 request_loan(p_book_id)
create or replace function public.request_loan(p_book_id bigint)
returns public.loan_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_profile public.profiles%rowtype;
  v_policy public.loan_policies%rowtype;
  v_active_count integer;
  v_req public.loan_requests%rowtype;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  if not v_profile.is_active then
    raise exception 'MEMBER_INACTIVE' using errcode = 'P0001';
  end if;

  if v_profile.role not in ('student', 'teacher') then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.books where id = p_book_id) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  -- BR-03: Satu anggota tidak boleh memiliki > 1 pengajuan terbuka atau pinjaman aktif untuk judul yang sama
  if exists (
    select 1 from public.loan_requests
    where member_id = v_uid
      and book_id = p_book_id
      and status in ('pending', 'approved')
  ) or exists (
    select 1 from public.loans l
    join public.book_copies bc on bc.id = l.copy_id
    where l.member_id = v_uid
      and bc.book_id = p_book_id
      and l.status = 'active'
  ) then
    raise exception 'DUPLICATE_TITLE' using errcode = 'P0001';
  end if;

  -- BR-04: Pengajuan hanya dapat dibuat bila judul memiliki >= 1 eksemplar available
  if not exists (
    select 1 from public.book_copies
    where book_id = p_book_id
      and status = 'available'
  ) then
    raise exception 'NO_AVAILABLE_COPY' using errcode = 'P0001';
  end if;

  -- BR-02: Batas pinjam aktif + pengajuan terbuka <= max_active_loans
  select * into v_policy from public.loan_policies where role = v_profile.role;

  select (
    (select count(*) from public.loans where member_id = v_uid and status = 'active') +
    (select count(*) from public.loan_requests where member_id = v_uid and status in ('pending', 'approved'))
  )::integer into v_active_count;

  if v_active_count >= v_policy.max_active_loans then
    raise exception 'LOAN_LIMIT_REACHED' using errcode = 'P0001', detail = v_policy.max_active_loans::text;
  end if;

  insert into public.loan_requests (
    member_id,
    book_id,
    status,
    requested_at
  ) values (
    v_uid,
    p_book_id,
    'pending',
    now()
  ) returning * into v_req;

  perform private.log_activity(
    'loan_request.created',
    'loan_request',
    v_req.id::text,
    jsonb_build_object('book_id', p_book_id, 'member_id', v_uid)
  );

  return v_req;
end;
$$;

revoke execute on function public.request_loan(bigint) from public, anon;
grant execute on function public.request_loan(bigint) to authenticated;

-- 7.2 cancel_loan_request(p_request_id)
create or replace function public.cancel_loan_request(p_request_id bigint)
returns public.loan_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_req public.loan_requests%rowtype;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_req
  from public.loan_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_req.member_id != v_uid then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if v_req.status not in ('pending', 'approved') then
    raise exception 'REQUEST_INVALID_STATE' using errcode = 'P0001';
  end if;

  if v_req.status = 'approved' and v_req.reserved_copy_id is not null then
    update public.book_copies
    set status = 'available',
        updated_at = now()
    where id = v_req.reserved_copy_id
      and status = 'reserved';
  end if;

  update public.loan_requests
  set status = 'cancelled',
      closed_at = now(),
      updated_at = now()
  where id = p_request_id
  returning * into v_req;

  perform private.log_activity(
    'loan_request.cancelled',
    'loan_request',
    v_req.id::text,
    jsonb_build_object('book_id', v_req.book_id, 'released_copy_id', v_req.reserved_copy_id)
  );

  return v_req;
end;
$$;

revoke execute on function public.cancel_loan_request(bigint) from public, anon;
grant execute on function public.cancel_loan_request(bigint) to authenticated;

-- 7.3 request_return(p_loan_id)
create or replace function public.request_return(p_loan_id bigint)
returns public.loans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_loan public.loans%rowtype;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_loan
  from public.loans
  where id = p_loan_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_loan.member_id != v_uid then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if v_loan.status != 'active' then
    raise exception 'LOAN_INVALID_STATE' using errcode = 'P0001';
  end if;

  update public.loans
  set return_requested_at = coalesce(return_requested_at, now()),
      updated_at = now()
  where id = p_loan_id
  returning * into v_loan;

  perform private.log_activity(
    'loan.return_requested',
    'loan',
    v_loan.id::text,
    jsonb_build_object('copy_id', v_loan.copy_id)
  );

  return v_loan;
end;
$$;

revoke execute on function public.request_return(bigint) from public, anon;
grant execute on function public.request_return(bigint) to authenticated;

-- 7.4 approve_loan_request(p_request_id, p_copy_id)
create or replace function public.approve_loan_request(
  p_request_id bigint,
  p_copy_id bigint default null
)
returns public.loan_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.loan_requests%rowtype;
  v_member public.profiles%rowtype;
  v_policy public.loan_policies%rowtype;
  v_copy public.book_copies%rowtype;
  v_deadline timestamptz;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_req
  from public.loan_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_req.status != 'pending' then
    raise exception 'REQUEST_INVALID_STATE' using errcode = 'P0001';
  end if;

  select * into v_member from public.profiles where id = v_req.member_id;
  if not found or not v_member.is_active then
    raise exception 'MEMBER_INACTIVE' using errcode = 'P0001';
  end if;

  select * into v_policy from public.loan_policies where role = v_member.role;

  if p_copy_id is not null then
    select * into v_copy
    from public.book_copies
    where id = p_copy_id
      and book_id = v_req.book_id
      and status = 'available'
    for update skip locked;
  else
    select * into v_copy
    from public.book_copies
    where book_id = v_req.book_id
      and status = 'available'
    order by id asc
    limit 1
    for update skip locked;
  end if;

  if not found then
    raise exception 'NO_AVAILABLE_COPY' using errcode = 'P0001';
  end if;

  -- BR-05: pickup_deadline = 23:59:59 WITA pada (today_wita() + pickup_days)
  v_deadline := (((private.today_wita() + v_policy.pickup_days)::text || ' 23:59:59')::timestamp at time zone 'Asia/Makassar');

  update public.book_copies
  set status = 'reserved',
      updated_at = now()
  where id = v_copy.id;

  update public.loan_requests
  set status = 'approved',
      reserved_copy_id = v_copy.id,
      pickup_deadline = v_deadline,
      decided_at = now(),
      decided_by = (select auth.uid()),
      updated_at = now()
  where id = p_request_id
  returning * into v_req;

  perform private.log_activity(
    'loan_request.approved',
    'loan_request',
    v_req.id::text,
    jsonb_build_object(
      'copy_id', v_copy.id,
      'copy_code', v_copy.code,
      'pickup_deadline', v_deadline
    )
  );

  return v_req;
end;
$$;

revoke execute on function public.approve_loan_request(bigint, bigint) from public, anon;
grant execute on function public.approve_loan_request(bigint, bigint) to authenticated;

-- 7.5 reject_loan_request(p_request_id, p_reason)
create or replace function public.reject_loan_request(
  p_request_id bigint,
  p_reason text
)
returns public.loan_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.loan_requests%rowtype;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  select * into v_req
  from public.loan_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_req.status != 'pending' then
    raise exception 'REQUEST_INVALID_STATE' using errcode = 'P0001';
  end if;

  update public.loan_requests
  set status = 'rejected',
      reject_reason = trim(p_reason),
      decided_at = now(),
      decided_by = (select auth.uid()),
      closed_at = now(),
      updated_at = now()
  where id = p_request_id
  returning * into v_req;

  perform private.log_activity(
    'loan_request.rejected',
    'loan_request',
    v_req.id::text,
    jsonb_build_object('reason', trim(p_reason))
  );

  return v_req;
end;
$$;

revoke execute on function public.reject_loan_request(bigint, text) from public, anon;
grant execute on function public.reject_loan_request(bigint, text) to authenticated;

-- 7.6 checkout_copy(p_member_id, p_copy_code) & alias checkout_loan
create or replace function public.checkout_copy(
  p_member_id uuid,
  p_copy_code text
)
returns public.loans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.profiles%rowtype;
  v_policy public.loan_policies%rowtype;
  v_copy public.book_copies%rowtype;
  v_approved_req public.loan_requests%rowtype;
  v_has_approved_req boolean := false;
  v_active_count integer;
  v_due_date date;
  v_loan public.loans%rowtype;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_member from public.profiles where id = p_member_id;
  if not found then
    raise exception 'MEMBER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not v_member.is_active then
    raise exception 'MEMBER_INACTIVE' using errcode = 'P0001';
  end if;

  if v_member.role not in ('student', 'teacher') then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_policy from public.loan_policies where role = v_member.role;

  select * into v_copy
  from public.book_copies
  where lower(code) = lower(trim(coalesce(p_copy_code, '')))
  for update;

  if not found then
    raise exception 'COPY_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- BR-03: Anggota tidak boleh meminjam judul yang sedang aktif dipinjamnya
  if exists (
    select 1 from public.loans l
    join public.book_copies bc on bc.id = l.copy_id
    where l.member_id = p_member_id
      and bc.book_id = v_copy.book_id
      and l.status = 'active'
  ) then
    raise exception 'DUPLICATE_TITLE' using errcode = 'P0001';
  end if;

  -- Cek apakah anggota punya pengajuan approved untuk buku ini (BR-07, BR-08)
  select * into v_approved_req
  from public.loan_requests
  where member_id = p_member_id
    and book_id = v_copy.book_id
    and status = 'approved'
  for update;

  if found then
    v_has_approved_req := true;

    if v_copy.id = v_approved_req.reserved_copy_id then
      if v_copy.status not in ('reserved', 'available') then
        raise exception 'COPY_NOT_AVAILABLE' using errcode = 'P0001';
      end if;
    else
      -- TC-CIR-09 / BR-08: Eksemplar yang dipindai berbeda dari yang dialokasikan
      if v_copy.status != 'available' then
        raise exception 'COPY_NOT_AVAILABLE' using errcode = 'P0001';
      end if;
      -- Lepas eksemplar alokasi lama menjadi available
      update public.book_copies
      set status = 'available',
          updated_at = now()
      where id = v_approved_req.reserved_copy_id
        and status = 'reserved';
    end if;

    update public.loan_requests
    set status = 'fulfilled',
        closed_at = now(),
        updated_at = now()
    where id = v_approved_req.id;
  else
    -- Walk-in checkout (tanpa pengajuan approved)
    if v_copy.status != 'available' then
      raise exception 'COPY_NOT_AVAILABLE' using errcode = 'P0001';
    end if;

    -- BR-03: Tolak bila sudah ada pengajuan pending untuk judul yang sama
    if exists (
      select 1 from public.loan_requests
      where member_id = p_member_id
        and book_id = v_copy.book_id
        and status = 'pending'
    ) then
      raise exception 'DUPLICATE_TITLE' using errcode = 'P0001';
    end if;

    -- BR-02: Periksa batas pinjaman aktif + pengajuan terbuka
    select (
      (select count(*) from public.loans where member_id = p_member_id and status = 'active') +
      (select count(*) from public.loan_requests where member_id = p_member_id and status in ('pending', 'approved'))
    )::integer into v_active_count;

    if v_active_count >= v_policy.max_active_loans then
      raise exception 'LOAN_LIMIT_REACHED' using errcode = 'P0001', detail = v_policy.max_active_loans::text;
    end if;
  end if;

  v_due_date := private.today_wita() + v_policy.loan_days;

  update public.book_copies
  set status = 'on_loan',
      updated_at = now()
  where id = v_copy.id;

  insert into public.loans (
    copy_id,
    member_id,
    request_id,
    status,
    loaned_at,
    due_date,
    daily_fine_snapshot,
    checked_out_by
  ) values (
    v_copy.id,
    p_member_id,
    case when v_has_approved_req then v_approved_req.id else null end,
    'active',
    now(),
    v_due_date,
    v_policy.daily_fine,
    (select auth.uid())
  ) returning * into v_loan;

  perform private.log_activity(
    'loan.checked_out',
    'loan',
    v_loan.id::text,
    jsonb_build_object(
      'member_id', p_member_id,
      'copy_id', v_copy.id,
      'copy_code', v_copy.code,
      'request_id', v_loan.request_id,
      'due_date', v_due_date
    )
  );

  return v_loan;
end;
$$;

revoke execute on function public.checkout_copy(uuid, text) from public, anon;
grant execute on function public.checkout_copy(uuid, text) to authenticated;

create or replace function public.checkout_loan(
  p_member_id uuid,
  p_copy_code text
)
returns public.loans
language sql
security definer
set search_path = ''
as $$
  select public.checkout_copy(p_member_id, p_copy_code);
$$;

revoke execute on function public.checkout_loan(uuid, text) from public, anon;
grant execute on function public.checkout_loan(uuid, text) to authenticated;

-- 7.7 checkin_copy(p_copy_code, p_condition, p_damage_fine, p_notes) & alias checkin_loan
create or replace function public.checkin_copy(
  p_copy_code text,
  p_condition text default 'good',
  p_damage_fine integer default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_condition text;
  v_copy public.book_copies%rowtype;
  v_loan public.loans%rowtype;
  v_days_late integer;
  v_late_fine integer;
  v_late_fine_id bigint;
  v_damage_fine_id bigint;
  v_new_copy_status public.copy_status;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  v_condition := coalesce(p_condition, 'good');
  if v_condition not in ('good', 'damaged') then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  if p_damage_fine is not null and p_damage_fine <= 0 then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  select * into v_copy
  from public.book_copies
  where lower(code) = lower(trim(coalesce(p_copy_code, '')))
  for update;

  if not found then
    raise exception 'COPY_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_loan
  from public.loans
  where copy_id = v_copy.id
    and status = 'active'
  for update;

  if not found then
    raise exception 'COPY_NOT_ON_LOAN' using errcode = 'P0001';
  end if;

  -- BR-10 & BR-11: Hitung hari kalender terlambat WITA dan denda keterlambatan
  v_days_late := greatest(0, (private.today_wita() - v_loan.due_date))::integer;
  v_late_fine := v_days_late * v_loan.daily_fine_snapshot;

  update public.loans
  set status = 'returned',
      returned_at = now(),
      checked_in_by = (select auth.uid()),
      return_condition = v_condition,
      notes = coalesce(p_notes, notes),
      updated_at = now()
  where id = v_loan.id
  returning * into v_loan;

  v_new_copy_status := case when v_condition = 'damaged' then 'damaged'::public.copy_status else 'available'::public.copy_status end;

  update public.book_copies
  set status = v_new_copy_status,
      notes = case when p_notes is not null then p_notes else notes end,
      updated_at = now()
  where id = v_copy.id;

  if v_late_fine > 0 then
    insert into public.fines (
      loan_id,
      member_id,
      type,
      days_late,
      amount,
      status,
      notes,
      created_by
    ) values (
      v_loan.id,
      v_loan.member_id,
      'late',
      v_days_late,
      v_late_fine,
      'unpaid',
      'Denda keterlambatan ' || v_days_late || ' hari',
      null
    ) returning id into v_late_fine_id;

    perform private.log_activity(
      'fine.created',
      'fine',
      v_late_fine_id::text,
      jsonb_build_object(
        'loan_id', v_loan.id,
        'type', 'late',
        'days_late', v_days_late,
        'amount', v_late_fine
      )
    );
  end if;

  if v_condition = 'damaged' and p_damage_fine is not null and p_damage_fine > 0 then
    insert into public.fines (
      loan_id,
      member_id,
      type,
      amount,
      status,
      notes,
      created_by
    ) values (
      v_loan.id,
      v_loan.member_id,
      'damage',
      p_damage_fine,
      'unpaid',
      coalesce(p_notes, 'Denda kerusakan buku'),
      (select auth.uid())
    ) returning id into v_damage_fine_id;

    perform private.log_activity(
      'fine.created',
      'fine',
      v_damage_fine_id::text,
      jsonb_build_object(
        'loan_id', v_loan.id,
        'type', 'damage',
        'amount', p_damage_fine
      )
    );
  end if;

  perform private.log_activity(
    'loan.checked_in',
    'loan',
    v_loan.id::text,
    jsonb_build_object(
      'copy_id', v_copy.id,
      'copy_code', v_copy.code,
      'condition', v_condition,
      'days_late', v_days_late,
      'late_fine', v_late_fine,
      'damage_fine', coalesce(p_damage_fine, 0)
    )
  );

  return jsonb_build_object(
    'loan_id', v_loan.id,
    'copy_id', v_copy.id,
    'copy_code', v_copy.code,
    'member_id', v_loan.member_id,
    'condition', v_condition,
    'days_late', v_days_late,
    'late_fine', v_late_fine,
    'damage_fine', coalesce(p_damage_fine, 0)
  );
end;
$$;

revoke execute on function public.checkin_copy(text, text, integer, text) from public, anon;
grant execute on function public.checkin_copy(text, text, integer, text) to authenticated;

create or replace function public.checkin_loan(
  p_copy_code text,
  p_condition text default 'good',
  p_damage_fine integer default null,
  p_notes text default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.checkin_copy(p_copy_code, p_condition, p_damage_fine, p_notes);
$$;

revoke execute on function public.checkin_loan(text, text, integer, text) from public, anon;
grant execute on function public.checkin_loan(text, text, integer, text) to authenticated;

-- 7.8 mark_loan_lost(p_loan_id, p_amount, p_notes)
create or replace function public.mark_loan_lost(
  p_loan_id bigint,
  p_amount integer default null,
  p_notes text default null
)
returns public.loans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_loan public.loans%rowtype;
  v_copy public.book_copies%rowtype;
  v_loss_amount integer;
  v_days_late integer;
  v_late_fine integer;
  v_late_fine_id bigint;
  v_loss_fine_id bigint;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_loan
  from public.loans
  where id = p_loan_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_loan.status != 'active' then
    raise exception 'LOAN_INVALID_STATE' using errcode = 'P0001';
  end if;

  select * into v_copy
  from public.book_copies
  where id = v_loan.copy_id
  for update;

  v_loss_amount := coalesce(p_amount, v_copy.price, 50000);
  if v_loss_amount <= 0 then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  -- BR-11: Bila pinjaman ditandai hilang dalam keadaan terlambat, denda keterlambatan dihitung sampai tanggal penandaan
  v_days_late := greatest(0, (private.today_wita() - v_loan.due_date))::integer;
  v_late_fine := v_days_late * v_loan.daily_fine_snapshot;

  update public.loans
  set status = 'lost',
      lost_at = now(),
      notes = coalesce(p_notes, notes),
      updated_at = now()
  where id = p_loan_id
  returning * into v_loan;

  update public.book_copies
  set status = 'lost',
      notes = case when p_notes is not null then p_notes else notes end,
      updated_at = now()
  where id = v_copy.id;

  if v_late_fine > 0 then
    insert into public.fines (
      loan_id,
      member_id,
      type,
      days_late,
      amount,
      status,
      notes,
      created_by
    ) values (
      v_loan.id,
      v_loan.member_id,
      'late',
      v_days_late,
      v_late_fine,
      'unpaid',
      'Denda keterlambatan ' || v_days_late || ' hari (sebelum ditandai hilang)',
      null
    ) on conflict (loan_id, type) do nothing
    returning id into v_late_fine_id;

    if v_late_fine_id is not null then
      perform private.log_activity(
        'fine.created',
        'fine',
        v_late_fine_id::text,
        jsonb_build_object(
          'loan_id', v_loan.id,
          'type', 'late',
          'days_late', v_days_late,
          'amount', v_late_fine
        )
      );
    end if;
  end if;

  insert into public.fines (
    loan_id,
    member_id,
    type,
    amount,
    status,
    notes,
    created_by
  ) values (
    v_loan.id,
    v_loan.member_id,
    'loss',
    v_loss_amount,
    'unpaid',
    coalesce(p_notes, 'Denda penggantian buku hilang'),
    (select auth.uid())
  ) returning id into v_loss_fine_id;

  perform private.log_activity(
    'fine.created',
    'fine',
    v_loss_fine_id::text,
    jsonb_build_object(
      'loan_id', v_loan.id,
      'type', 'loss',
      'amount', v_loss_amount
    )
  );

  perform private.log_activity(
    'loan.lost',
    'loan',
    v_loan.id::text,
    jsonb_build_object(
      'copy_id', v_copy.id,
      'copy_code', v_copy.code,
      'loss_amount', v_loss_amount,
      'days_late', v_days_late
    )
  );

  return v_loan;
end;
$$;

revoke execute on function public.mark_loan_lost(bigint, integer, text) from public, anon;
grant execute on function public.mark_loan_lost(bigint, integer, text) to authenticated;

-- 7.9 pay_fine(p_fine_id)
create or replace function public.pay_fine(p_fine_id bigint)
returns public.fines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fine public.fines%rowtype;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_fine
  from public.fines
  where id = p_fine_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_fine.status != 'unpaid' then
    raise exception 'FINE_INVALID_STATE' using errcode = 'P0001', detail = 'FINE_ALREADY_SETTLED';
  end if;

  update public.fines
  set status = 'paid',
      paid_at = now(),
      received_by = (select auth.uid()),
      updated_at = now()
  where id = p_fine_id
  returning * into v_fine;

  perform private.log_activity(
    'fine.paid',
    'fine',
    v_fine.id::text,
    jsonb_build_object(
      'loan_id', v_fine.loan_id,
      'member_id', v_fine.member_id,
      'amount', v_fine.amount
    )
  );

  return v_fine;
end;
$$;

revoke execute on function public.pay_fine(bigint) from public, anon;
grant execute on function public.pay_fine(bigint) to authenticated;

-- 7.10 waive_fine(p_fine_id, p_reason)
create or replace function public.waive_fine(
  p_fine_id bigint,
  p_reason text
)
returns public.fines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fine public.fines%rowtype;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  select * into v_fine
  from public.fines
  where id = p_fine_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_fine.status != 'unpaid' then
    raise exception 'FINE_INVALID_STATE' using errcode = 'P0001', detail = 'FINE_ALREADY_SETTLED';
  end if;

  update public.fines
  set status = 'waived',
      waived_at = now(),
      waived_by = (select auth.uid()),
      waived_reason = trim(p_reason),
      updated_at = now()
  where id = p_fine_id
  returning * into v_fine;

  perform private.log_activity(
    'fine.waived',
    'fine',
    v_fine.id::text,
    jsonb_build_object(
      'loan_id', v_fine.loan_id,
      'member_id', v_fine.member_id,
      'amount', v_fine.amount,
      'reason', trim(p_reason)
    )
  );

  return v_fine;
end;
$$;

revoke execute on function public.waive_fine(bigint, text) from public, anon;
grant execute on function public.waive_fine(bigint, text) to authenticated;

-- 7.11 private.expire_overdue_pickups() (FR-CIR-13, BR-06)
create or replace function private.expire_overdue_pickups()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req record;
  v_count integer := 0;
begin
  for v_req in
    select id, reserved_copy_id, pickup_deadline, book_id, member_id
    from public.loan_requests
    where status = 'approved'
      and pickup_deadline < now()
    for update skip locked
  loop
    if v_req.reserved_copy_id is not null then
      update public.book_copies
      set status = 'available',
          updated_at = now()
      where id = v_req.reserved_copy_id
        and status = 'reserved';
    end if;

    update public.loan_requests
    set status = 'expired',
        closed_at = now(),
        updated_at = now()
    where id = v_req.id;

    insert into public.activity_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      details
    ) values (
      null,
      'loan_request.expired',
      'loan_request',
      v_req.id::text,
      jsonb_build_object(
        'book_id', v_req.book_id,
        'member_id', v_req.member_id,
        'released_copy_id', v_req.reserved_copy_id,
        'pickup_deadline', v_req.pickup_deadline
      )
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function private.expire_overdue_pickups() from public, anon, authenticated;

-- 7.12 lookup_member(p_code) & lookup_copy(p_code) (PRD §12.2)
create or replace function public.lookup_member(p_code text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
stable
as $$
declare
  v_login_id text;
  v_profile public.profiles%rowtype;
  v_policy public.loan_policies%rowtype;
  v_active_loans integer;
  v_overdue_loans integer;
  v_open_requests integer;
  v_unpaid_fines integer;
  v_approved_requests jsonb;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  v_login_id := lower(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  select * into v_profile
  from public.profiles
  where login_id = v_login_id
     or lower(member_code) = lower(trim(coalesce(p_code, '')))
  limit 1;

  if not found then
    raise exception 'MEMBER_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_policy from public.loan_policies where role = v_profile.role;

  select count(*)::integer into v_active_loans
  from public.loans
  where member_id = v_profile.id and status = 'active';

  select count(*)::integer into v_overdue_loans
  from public.loans
  where member_id = v_profile.id
    and status = 'active'
    and private.today_wita() > due_date;

  select count(*)::integer into v_open_requests
  from public.loan_requests
  where member_id = v_profile.id
    and status in ('pending', 'approved');

  select coalesce(sum(amount), 0)::integer into v_unpaid_fines
  from public.fines
  where member_id = v_profile.id
    and status = 'unpaid';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', lr.id,
        'book_id', lr.book_id,
        'book_title', b.title,
        'reserved_copy_id', lr.reserved_copy_id,
        'reserved_copy_code', bc.code,
        'pickup_deadline', lr.pickup_deadline
      ) order by lr.requested_at asc
    ),
    '[]'::jsonb
  ) into v_approved_requests
  from public.loan_requests lr
  join public.books b on b.id = lr.book_id
  left join public.book_copies bc on bc.id = lr.reserved_copy_id
  where lr.member_id = v_profile.id
    and lr.status = 'approved';

  return jsonb_build_object(
    'id', v_profile.id,
    'member_code', v_profile.member_code,
    'full_name', v_profile.full_name,
    'role', v_profile.role,
    'class_name', v_profile.class_name,
    'is_active', v_profile.is_active,
    'max_active_loans', coalesce(v_policy.max_active_loans, 5),
    'loan_days', coalesce(v_policy.loan_days, 7),
    'daily_fine', coalesce(v_policy.daily_fine, 500),
    'active_loans_count', v_active_loans,
    'open_requests_count', v_open_requests,
    'overdue_loans_count', v_overdue_loans,
    'unpaid_fines_total', v_unpaid_fines,
    'approved_requests', v_approved_requests
  );
end;
$$;

revoke execute on function public.lookup_member(text) from public, anon;
grant execute on function public.lookup_member(text) to authenticated;

create or replace function public.lookup_copy(p_code text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
stable
as $$
declare
  v_copy public.book_copies%rowtype;
  v_book public.books%rowtype;
  v_active_loan jsonb;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_copy
  from public.book_copies
  where lower(code) = lower(trim(coalesce(p_code, '')))
  limit 1;

  if not found then
    raise exception 'COPY_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_book from public.books where id = v_copy.book_id;

  select to_jsonb(vl.*) into v_active_loan
  from public.v_loans vl
  where vl.copy_id = v_copy.id
    and vl.status = 'active'
  limit 1;

  return jsonb_build_object(
    'copy_id', v_copy.id,
    'copy_code', v_copy.code,
    'copy_status', v_copy.status,
    'price', v_copy.price,
    'book_id', v_book.id,
    'book_title', v_book.title,
    'book_authors', v_book.authors,
    'call_number', v_book.call_number,
    'active_loan', v_active_loan
  );
end;
$$;

revoke execute on function public.lookup_copy(text) from public, anon;
grant execute on function public.lookup_copy(text) to authenticated;
