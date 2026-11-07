-- Migration: 20261107120000_materials_cards.sql
-- Modul: MAT (Bahan Ajar) & CARD (Kartu Anggota) (Milestone M4A)
-- Kebutuhan: FR-MAT-01 s.d. FR-MAT-05, FR-CARD-01 s.d. FR-CARD-03, BR-19, BR-20

-- 1. Enum material_status (PRD §11.3)
create type public.material_status as enum ('published', 'hidden');

-- 2. Tabel teaching_materials (Bahan Ajar Guru — PRD §11.4)
create table public.teaching_materials (
  id bigint generated always as identity primary key,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  description text,
  subject text not null,
  major_id bigint references public.majors(id) on delete set null,
  grade_level smallint check (grade_level in (10, 11, 12)),
  file_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size integer not null check (file_size between 1 and 10485760),
  status public.material_status not null default 'published',
  hidden_reason text,
  hidden_by uuid references public.profiles(id) on delete set null,
  download_count integer not null default 0 check (download_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teaching_materials_hidden_check check (
    (status = 'hidden' and hidden_reason is not null and length(trim(hidden_reason)) > 0 and hidden_by is not null)
    or (status != 'hidden')
  )
);

-- Indeks tabel teaching_materials (PRD §11.6)
create index idx_teaching_materials_status_created on public.teaching_materials(status, created_at desc);
create index idx_teaching_materials_teacher_id on public.teaching_materials(teacher_id);
create index idx_teaching_materials_major_id on public.teaching_materials(major_id);
create index idx_teaching_materials_grade_level on public.teaching_materials(grade_level);
create index idx_teaching_materials_subject on public.teaching_materials(subject);
create index idx_teaching_materials_title_trgm on public.teaching_materials using gin (title extensions.gin_trgm_ops);

-- Trigger updated_at
create trigger trg_teaching_materials_updated_at
  before update on public.teaching_materials
  for each row execute function private.set_updated_at();

-- 3. Storage Bucket materials (PRD §11.7, §13.4)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

-- Kebijakan Storage objects untuk bucket materials (PRD §13.4)
create policy "Authenticated can read authorized materials"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'materials'
    and (
      (select private.is_librarian())
      or exists (
        select 1 from public.teaching_materials tm
        where tm.file_path = name
          and (
            tm.status = 'published'
            or tm.teacher_id = (select auth.uid())
          )
      )
    )
  );

create policy "Teachers can upload materials to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'materials'
    and (select private.current_app_role()) = 'teacher'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners and librarians can delete materials"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'materials'
    and (
      (select private.is_librarian())
      or (
        (select private.current_app_role()) = 'teacher'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
    )
  );

-- 4. Kebijakan RLS Tabel teaching_materials (PRD §13.3)
alter table public.teaching_materials enable row level security;

create policy "teaching_materials_select"
  on public.teaching_materials for select
  to authenticated
  using (
    status = 'published'
    or teacher_id = (select auth.uid())
    or (select private.is_librarian())
  );

create policy "teaching_materials_insert_teacher"
  on public.teaching_materials for insert
  to authenticated
  with check (
    (select private.current_app_role()) = 'teacher'
    and teacher_id = (select auth.uid())
    and status = 'published'
  );

create policy "teaching_materials_update_teacher"
  on public.teaching_materials for update
  to authenticated
  using (
    (select private.current_app_role()) = 'teacher'
    and teacher_id = (select auth.uid())
  )
  with check (
    (select private.current_app_role()) = 'teacher'
    and teacher_id = (select auth.uid())
  );

create policy "teaching_materials_delete"
  on public.teaching_materials for delete
  to authenticated
  using (
    teacher_id = (select auth.uid())
    or (select private.is_librarian())
  );

-- Hak akses tabel teaching_materials (PRD §13.3: update hanya kolom metadata)
grant select, insert, delete on public.teaching_materials to authenticated;
grant update (title, description, subject, major_id, grade_level) on public.teaching_materials to authenticated;

-- 5. RPC increment_material_downloads (PRD §8 FR-MAT-05, §13.5)
create or replace function public.increment_material_downloads(p_material_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_uid uuid;
  v_status public.material_status;
  v_teacher_id uuid;
begin
  v_auth_uid := auth.uid();
  if v_auth_uid is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select status, teacher_id
    into v_status, v_teacher_id
  from public.teaching_materials
  where id = p_material_id;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_status = 'hidden' and v_teacher_id != v_auth_uid and not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  update public.teaching_materials
  set download_count = download_count + 1
  where id = p_material_id;
end;
$$;

revoke execute on function public.increment_material_downloads(bigint) from public, anon;
grant execute on function public.increment_material_downloads(bigint) to authenticated;

-- 6. RPC set_material_visibility (PRD §12.2, FR-MAT-04)
create or replace function public.set_material_visibility(
  p_material_id bigint,
  p_visible boolean,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exists boolean;
  v_clean_reason text;
begin
  if not private.is_librarian() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select exists(select 1 from public.teaching_materials where id = p_material_id) into v_exists;
  if not v_exists then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if not p_visible then
    v_clean_reason := trim(coalesce(p_reason, ''));
    if length(v_clean_reason) = 0 then
      raise exception 'VALIDATION_ERROR' using errcode = 'P0001', detail = 'Alasan penyembunyian wajib diisi.';
    end if;

    update public.teaching_materials
    set status = 'hidden',
        hidden_reason = v_clean_reason,
        hidden_by = auth.uid(),
        updated_at = now()
    where id = p_material_id;

    perform private.log_activity(
      'material.hidden',
      'material',
      p_material_id::text,
      jsonb_build_object('reason', v_clean_reason)
    );
  else
    update public.teaching_materials
    set status = 'published',
        hidden_reason = null,
        hidden_by = null,
        updated_at = now()
    where id = p_material_id;

    perform private.log_activity(
      'material.shown',
      'material',
      p_material_id::text,
      '{}'::jsonb
    );
  end if;
end;
$$;

revoke execute on function public.set_material_visibility(bigint, boolean, text) from public, anon;
grant execute on function public.set_material_visibility(bigint, boolean, text) to authenticated;
