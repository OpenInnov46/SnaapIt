-- ============================================================
-- Snaapit — Full migration (idempotent, safe to re-run)
-- Run this in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/bsqfnqqylmtbckvwdxhi/sql/new
-- ============================================================

-- 1. pgvector extension
create extension if not exists vector with schema extensions;

-- ============================================================
-- 2. Profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can view own profile'
  ) then
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can update own profile'
  ) then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Auto-create / update profile on signup
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. Folders
-- ============================================================
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.folders enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='folders' and policyname='Users can view own folders') then
    create policy "Users can view own folders" on public.folders for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='folders' and policyname='Users can insert own folders') then
    create policy "Users can insert own folders" on public.folders for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='folders' and policyname='Users can update own folders') then
    create policy "Users can update own folders" on public.folders for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='folders' and policyname='Users can delete own folders') then
    create policy "Users can delete own folders" on public.folders for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ============================================================
-- 4. Bookmarks
-- ============================================================
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  description text,
  favicon_url text,
  folder_id uuid references public.folders(id) on delete set null,
  tags text[] default '{}',
  embedding vector(1536),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.bookmarks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookmarks' and policyname='Users can view own bookmarks') then
    create policy "Users can view own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookmarks' and policyname='Users can insert own bookmarks') then
    create policy "Users can insert own bookmarks" on public.bookmarks for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookmarks' and policyname='Users can update own bookmarks') then
    create policy "Users can update own bookmarks" on public.bookmarks for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookmarks' and policyname='Users can delete own bookmarks') then
    create policy "Users can delete own bookmarks" on public.bookmarks for delete using (auth.uid() = user_id);
  end if;
end $$;

-- HNSW index for fast cosine similarity search (ignored if already exists)
create index if not exists bookmarks_embedding_idx
  on public.bookmarks
  using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- 5. Semantic search RPC
-- ============================================================
create or replace function public.match_bookmarks(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 10,
  p_user_id uuid default null
)
returns table (
  id uuid,
  user_id uuid,
  url text,
  title text,
  description text,
  favicon_url text,
  folder_id uuid,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    b.id,
    b.user_id,
    b.url,
    b.title,
    b.description,
    b.favicon_url,
    b.folder_id,
    b.tags,
    b.created_at,
    b.updated_at,
    1 - (b.embedding <=> query_embedding) as similarity
  from public.bookmarks b
  where
    b.user_id = p_user_id
    and 1 - (b.embedding <=> query_embedding) > match_threshold
  order by b.embedding <=> query_embedding
  limit match_count;
$$;
