-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- ============================================================
-- Profiles (auto-populated from auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Folders
-- ============================================================
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.folders enable row level security;

create policy "Users can view own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can insert own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own folders"
  on public.folders for update
  using (auth.uid() = user_id);

create policy "Users can delete own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Bookmarks
-- ============================================================
create table public.bookmarks (
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

create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- HNSW index for fast cosine similarity search
create index bookmarks_embedding_idx
  on public.bookmarks
  using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- Semantic search RPC
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
