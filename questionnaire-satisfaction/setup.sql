-- À exécuter une seule fois dans Supabase > SQL Editor
create table if not exists public.satisfaction_sessions (
 id uuid primary key default gen_random_uuid(), code text unique not null, event_name text not null,
 event_date date not null, event_place text, active boolean not null default true, created_at timestamptz default now()
);
create table if not exists public.satisfaction_responses (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.satisfaction_sessions(id) on delete cascade,
 name text not null, job text not null, newsletter text not null, email text,
 before jsonb not null, after jsonb not null, deepen jsonb not null, learned text not null,
 adapted text not null, quality text not null, equipped text not null, changes text not null,
 emotion text not null, useful text not null, improve text not null, satisfaction int not null check(satisfaction between 1 and 5),
 remarks text, created_at timestamptz default now()
);
alter table public.satisfaction_sessions enable row level security;
alter table public.satisfaction_responses enable row level security;
drop policy if exists "public read active satisfaction sessions" on public.satisfaction_sessions;
create policy "public read active satisfaction sessions" on public.satisfaction_sessions for select to anon using(active=true);
drop policy if exists "public insert satisfaction responses" on public.satisfaction_responses;
create policy "public insert satisfaction responses" on public.satisfaction_responses for insert to anon with check(true);
drop policy if exists "admin all satisfaction sessions" on public.satisfaction_sessions;
create policy "admin all satisfaction sessions" on public.satisfaction_sessions for all to authenticated using(true) with check(true);
drop policy if exists "admin read satisfaction responses" on public.satisfaction_responses;
create policy "admin read satisfaction responses" on public.satisfaction_responses for select to authenticated using(true);
