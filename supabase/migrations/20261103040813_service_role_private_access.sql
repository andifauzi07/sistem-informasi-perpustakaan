-- Migrasi: Izinkan service_role mengakses skema private dan update profil anggota dengan aman (BR-15)

grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;

create or replace function private.enforce_profile_update_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_librarian boolean;
begin
  -- Pengecualian bila dijalankan oleh service_role (Edge Function / admin scripts)
  if (select auth.role()) = 'service_role' then
    -- Tetap kunci nomor induk dan peran sesuai BR-15 jika baris sudah ada
    if new.id != old.id or new.member_code != old.member_code or new.role != old.role then
      raise exception 'FORBIDDEN' using errcode = 'P0001', detail = 'Nomor induk dan peran tidak dapat diubah (BR-15)';
    end if;
    return new;
  end if;

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
