-- ============================================================
-- Admin Role Support
-- ============================================================
-- Add a role column to profiles so the application can distinguish
-- regular users from the admin (first registered account).
alter table public.profiles
  add column if not exists role text not null default 'user';

-- Update the trigger to persist the role stored in user_metadata.
-- The backend sets role='admin' via the service role key for the first user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do update
    set
      email      = excluded.email,
      full_name  = excluded.full_name,
      avatar_url = excluded.avatar_url,
      role       = excluded.role,
      updated_at = now();
  return new;
end;
$$;
