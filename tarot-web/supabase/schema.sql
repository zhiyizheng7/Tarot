create extension if not exists "pgcrypto";

create table if not exists public.reading_threads (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.reading_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  aspect text,
  cards jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reading_threads_user_updated
  on public.reading_threads(user_id, updated_at desc);

create index if not exists idx_reading_messages_thread_created
  on public.reading_messages(thread_id, created_at asc);

alter table public.reading_threads enable row level security;
alter table public.reading_messages enable row level security;

create policy if not exists "reading_threads_owner_select"
  on public.reading_threads
  for select
  using (auth.jwt() ->> 'email' = user_id);

create policy if not exists "reading_threads_owner_insert"
  on public.reading_threads
  for insert
  with check (auth.jwt() ->> 'email' = user_id);

create policy if not exists "reading_threads_owner_update"
  on public.reading_threads
  for update
  using (auth.jwt() ->> 'email' = user_id)
  with check (auth.jwt() ->> 'email' = user_id);

create policy if not exists "reading_threads_owner_delete"
  on public.reading_threads
  for delete
  using (auth.jwt() ->> 'email' = user_id);

create policy if not exists "reading_messages_owner_select"
  on public.reading_messages
  for select
  using (
    exists (
      select 1
      from public.reading_threads t
      where t.id = thread_id
        and t.user_id = auth.jwt() ->> 'email'
    )
  );

create policy if not exists "reading_messages_owner_insert"
  on public.reading_messages
  for insert
  with check (
    exists (
      select 1
      from public.reading_threads t
      where t.id = thread_id
        and t.user_id = auth.jwt() ->> 'email'
    )
  );
