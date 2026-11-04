-- Migration: 20261104120000_collection_catalog.sql
-- Modul: COL (Koleksi) & CAT (Katalog) (Milestone M2)

-- 1. Ekstensi & Enum
create extension if not exists pg_trgm with schema extensions;

create type public.copy_status as enum ('available', 'reserved', 'on_loan', 'damaged', 'lost', 'withdrawn');
create type public.copy_source as enum ('purchase', 'donation', 'government', 'other');

-- 2. Tabel categories (Kategori Buku)
create table public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  ddc_code text,
  created_at timestamptz not null default now()
);

-- 3. Tabel books (Bibliografi Buku)
create table public.books (
  id bigint generated always as identity primary key,
  title text not null check (length(title) between 1 and 300),
  authors text not null,
  publisher text,
  publication_year smallint check (publication_year between 1800 and 2100),
  isbn text,
  category_id bigint not null references public.categories(id) on delete restrict,
  synopsis text,
  language text not null default 'Indonesia',
  pages integer check (pages > 0),
  edition text,
  call_number text,
  cover_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_books_category_id on public.books(category_id);
create unique index idx_books_isbn_unique on public.books(isbn) where isbn is not null;
create index idx_books_title_trgm on public.books using gin (title extensions.gin_trgm_ops);
create index idx_books_authors_trgm on public.books using gin (authors extensions.gin_trgm_ops);

create trigger trg_books_updated_at
  before update on public.books
  for each row execute function private.set_updated_at();

-- 4. Tabel book_copies (Eksemplar Fisik)
create sequence if not exists public.book_copy_code_seq;

create table public.book_copies (
  id bigint generated always as identity primary key,
  book_id bigint not null references public.books(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Za-z0-9./-]{1,30}$'),
  status public.copy_status not null default 'available',
  source public.copy_source,
  acquired_at date,
  price integer check (price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_book_copies_book_status on public.book_copies(book_id, status);
create index idx_book_copies_code on public.book_copies(code);

create trigger trg_book_copies_updated_at
  before update on public.book_copies
  for each row execute function private.set_updated_at();

-- 5. View v_book_availability (Ketersediaan Eksemplar Real-time)
create or replace view public.v_book_availability
with (security_invoker = true) as
select
  b.id as book_id,
  count(c.id) filter (where c.status not in ('lost', 'withdrawn'))::integer as total_copies,
  count(c.id) filter (where c.status = 'available')::integer as available_copies,
  count(c.id) filter (where c.status = 'on_loan')::integer as on_loan_copies,
  count(c.id) filter (where c.status = 'reserved')::integer as reserved_copies
from public.books b
left join public.book_copies c on c.book_id = b.id
group by b.id;

-- 6. Storage Bucket covers
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Covers bucket is public readable"
  on storage.objects for select
  to public
  using (bucket_id = 'covers');

create policy "Librarians can upload book covers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'covers'
    and (select private.is_librarian())
  );

create policy "Librarians can update book covers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'covers'
    and (select private.is_librarian())
  );

create policy "Librarians can delete book covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'covers'
    and (select private.is_librarian())
  );

-- 7. Kebijakan RLS Master Data
alter table public.categories enable row level security;

create policy "Categories select for authenticated"
  on public.categories for select
  to authenticated
  using (true);

create policy "Categories insert for librarian"
  on public.categories for insert
  to authenticated
  with check ((select private.is_librarian()));

create policy "Categories update for librarian"
  on public.categories for update
  to authenticated
  using ((select private.is_librarian()))
  with check ((select private.is_librarian()));

create policy "Categories delete for librarian"
  on public.categories for delete
  to authenticated
  using ((select private.is_librarian()));

alter table public.books enable row level security;

create policy "Books select for authenticated"
  on public.books for select
  to authenticated
  using (true);

create policy "Books insert for librarian"
  on public.books for insert
  to authenticated
  with check ((select private.is_librarian()));

create policy "Books update for librarian"
  on public.books for update
  to authenticated
  using ((select private.is_librarian()))
  with check ((select private.is_librarian()));

alter table public.book_copies enable row level security;

create policy "Book copies select for authenticated"
  on public.book_copies for select
  to authenticated
  using (true);

create policy "Book copies update for librarian"
  on public.book_copies for update
  to authenticated
  using ((select private.is_librarian()))
  with check ((select private.is_librarian()));

revoke insert, delete on public.book_copies from authenticated;
grant select on public.book_copies to authenticated;
grant update (source, acquired_at, price, notes) on public.book_copies to authenticated;

-- 8. Fungsi RPC

-- 8.1 add_book_copies
create or replace function public.add_book_copies(
  p_book_id bigint,
  p_quantity int default 1,
  p_codes text[] default null,
  p_source public.copy_source default null,
  p_acquired_at date default null,
  p_price int default null
)
returns setof public.book_copies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_next_val bigint;
  v_i int;
  v_new_codes text[] := '{}';
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.books where id = p_book_id) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if p_price is not null and p_price < 0 then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
  end if;

  -- Mode Manual
  if p_codes is not null and cardinality(p_codes) > 0 then
    if (select count(distinct c) from unnest(p_codes) c) != cardinality(p_codes) then
      raise exception 'CODE_TAKEN' using errcode = 'P0001';
    end if;

    foreach v_code in array p_codes loop
      if v_code is null or v_code !~ '^[A-Za-z0-9./-]{1,30}$' then
        raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
      end if;

      if exists (select 1 from public.book_copies where code = v_code) then
        raise exception 'CODE_TAKEN' using errcode = 'P0001';
      end if;
    end loop;

    v_new_codes := p_codes;

  -- Mode Otomatis
  else
    if p_quantity is null or p_quantity <= 0 or p_quantity > 100 then
      raise exception 'VALIDATION_ERROR' using errcode = 'P0001';
    end if;

    perform pg_advisory_xact_lock(hashtext('book_copies_seq_lock'));

    for v_i in 1..p_quantity loop
      loop
        v_next_val := nextval('public.book_copy_code_seq');
        v_code := 'B' || lpad(v_next_val::text, 6, '0');
        exit when not exists (select 1 from public.book_copies where code = v_code);
      end loop;
      v_new_codes := array_append(v_new_codes, v_code);
    end loop;
  end if;

  return query
  insert into public.book_copies (
    book_id,
    code,
    status,
    source,
    acquired_at,
    price
  )
  select
    p_book_id,
    c,
    'available'::public.copy_status,
    p_source,
    coalesce(p_acquired_at, private.today_wita()),
    p_price
  from unnest(v_new_codes) c
  returning *;

  perform private.log_activity(
    'copy.created',
    'book',
    p_book_id::text,
    jsonb_build_object(
      'quantity', cardinality(v_new_codes),
      'codes', v_new_codes,
      'source', p_source
    )
  );
end;
$$;

revoke execute on function public.add_book_copies from public, anon;
grant execute on function public.add_book_copies to authenticated;

-- 8.2 set_copy_status
create or replace function public.set_copy_status(
  p_copy_id bigint,
  p_status public.copy_status,
  p_notes text default null
)
returns public.book_copies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_copy public.book_copies%rowtype;
  v_current_status public.copy_status;
  v_is_valid boolean := false;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_copy from public.book_copies where id = p_copy_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  v_current_status := v_copy.status;

  -- Transisi manual PRD §10.4:
  -- available -> damaged, lost, withdrawn
  -- damaged -> available, withdrawn
  -- lost -> available, withdrawn
  if v_current_status = 'available' and p_status in ('damaged', 'lost', 'withdrawn') then
    v_is_valid := true;
  elsif v_current_status = 'damaged' and p_status in ('available', 'withdrawn') then
    v_is_valid := true;
  elsif v_current_status = 'lost' and p_status in ('available', 'withdrawn') then
    v_is_valid := true;
  end if;

  if not v_is_valid then
    raise exception 'INVALID_STATUS_TRANSITION' using errcode = 'P0001';
  end if;

  update public.book_copies
  set
    status = p_status,
    notes = case when p_notes is not null then p_notes else notes end,
    updated_at = now()
  where id = p_copy_id
  returning * into v_copy;

  perform private.log_activity(
    'copy.status_changed',
    'copy',
    p_copy_id::text,
    jsonb_build_object(
      'from_status', v_current_status,
      'to_status', p_status,
      'notes', p_notes
    )
  );

  return v_copy;
end;
$$;

revoke execute on function public.set_copy_status from public, anon;
grant execute on function public.set_copy_status to authenticated;

-- 8.3 delete_book
create or replace function public.delete_book(p_book_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exists boolean;
  v_has_history boolean := false;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select exists(select 1 from public.books where id = p_book_id) into v_exists;
  if not v_exists then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Periksa riwayat transaksi jika tabel pinjaman/pengajuan ada (M3)
  if to_regclass('public.loans') is not null then
    execute 'select exists(select 1 from public.loans l join public.book_copies c on l.copy_id = c.id where c.book_id = $1)'
    into v_has_history using p_book_id;
    if v_has_history then
      raise exception 'BOOK_HAS_HISTORY' using errcode = 'P0001';
    end if;
  end if;

  if to_regclass('public.loan_requests') is not null then
    execute 'select exists(select 1 from public.loan_requests lr where lr.book_id = $1)'
    into v_has_history using p_book_id;
    if v_has_history then
      raise exception 'BOOK_HAS_HISTORY' using errcode = 'P0001';
    end if;
  end if;

  delete from public.book_copies where book_id = p_book_id;
  delete from public.books where id = p_book_id;

  perform private.log_activity('book.deleted', 'book', p_book_id::text, '{}'::jsonb);
end;
$$;

revoke execute on function public.delete_book from public, anon;
grant execute on function public.delete_book to authenticated;

-- 8.4 search_catalog
create or replace function public.search_catalog(
  p_query text default null,
  p_category_id bigint default null,
  p_available_only boolean default false,
  p_sort text default 'relevance',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id bigint,
  title text,
  authors text,
  publisher text,
  publication_year smallint,
  isbn text,
  category_id bigint,
  category_name text,
  synopsis text,
  language text,
  pages integer,
  edition text,
  call_number text,
  cover_path text,
  created_at timestamptz,
  updated_at timestamptz,
  available_copies integer,
  total_copies integer,
  total_count bigint
)
language sql
security invoker
set search_path = ''
stable
as $$
  with filtered_books as (
    select
      b.id,
      b.title,
      b.authors,
      b.publisher,
      b.publication_year,
      b.isbn,
      b.category_id,
      c.name as category_name,
      b.synopsis,
      b.language,
      b.pages,
      b.edition,
      b.call_number,
      b.cover_path,
      b.created_at,
      b.updated_at,
      coalesce(v.available_copies, 0) as available_copies,
      coalesce(v.total_copies, 0) as total_copies,
      case
        when p_query is not null and length(trim(p_query)) > 0
        then extensions.similarity(b.title, trim(p_query))
        else 0
      end as sim_score
    from public.books b
    join public.categories c on c.id = b.category_id
    left join public.v_book_availability v on v.book_id = b.id
    where
      (
        p_query is null
        or length(trim(p_query)) = 0
        or b.title ilike ('%' || trim(p_query) || '%')
        or b.authors ilike ('%' || trim(p_query) || '%')
        or (b.isbn is not null and b.isbn ilike ('%' || trim(p_query) || '%'))
      )
      and (
        p_category_id is null
        or b.category_id = p_category_id
      )
      and (
        not coalesce(p_available_only, false)
        or coalesce(v.available_copies, 0) > 0
      )
  ),
  counted_books as (
    select
      *,
      count(*) over() as total_count
    from filtered_books
  )
  select
    id,
    title,
    authors,
    publisher,
    publication_year,
    isbn,
    category_id,
    category_name,
    synopsis,
    language,
    pages,
    edition,
    call_number,
    cover_path,
    created_at,
    updated_at,
    available_copies,
    total_copies,
    total_count
  from counted_books
  order by
    case when p_sort = 'title' then title end asc,
    case when p_sort = 'newest' then created_at end desc,
    case when p_sort = 'relevance' or p_sort is null then sim_score end desc,
    title asc
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

revoke execute on function public.search_catalog from public, anon;
grant execute on function public.search_catalog to authenticated;
