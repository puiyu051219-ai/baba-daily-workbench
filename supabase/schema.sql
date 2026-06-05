create table if not exists public.rooms (
  id text primary key,
  invite_code text not null unique,
  title text not null default 'LumiDay 今天有你',
  theme text not null default '高级可爱',
  app_state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  name text not null,
  avatar text not null,
  color text not null,
  mood text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.today_cards (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  owner_id text,
  status text not null default 'open',
  time_label text,
  votes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.study_items (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  course text not null,
  title text not null,
  body text,
  progress integer not null default 0,
  status text not null default 'open',
  ai_hint text,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_items (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  name text not null,
  city text,
  kind text not null default 'place',
  tags jsonb not null default '[]'::jsonb,
  cost numeric,
  score integer not null default 0,
  vote_by jsonb not null default '{}'::jsonb,
  reason text,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  kind text not null,
  title text not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  revealed boolean not null default false,
  reward text,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;
alter table public.profiles enable row level security;
alter table public.today_cards enable row level security;
alter table public.study_items enable row level security;
alter table public.trip_items enable row level security;
alter table public.game_sessions enable row level security;

drop policy if exists "demo rooms open access" on public.rooms;
create policy "demo rooms open access" on public.rooms for all using (true) with check (true);

drop policy if exists "demo profiles open access" on public.profiles;
create policy "demo profiles open access" on public.profiles for all using (true) with check (true);

drop policy if exists "demo today cards open access" on public.today_cards;
create policy "demo today cards open access" on public.today_cards for all using (true) with check (true);

drop policy if exists "demo study items open access" on public.study_items;
create policy "demo study items open access" on public.study_items for all using (true) with check (true);

drop policy if exists "demo trip items open access" on public.trip_items;
create policy "demo trip items open access" on public.trip_items for all using (true) with check (true);

drop policy if exists "demo game sessions open access" on public.game_sessions;
create policy "demo game sessions open access" on public.game_sessions for all using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
end $$;
