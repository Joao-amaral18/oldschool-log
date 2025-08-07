-- Extensões
create extension if not exists "pgcrypto";

-- Tipos
do $$
begin
  if not exists (select 1 from pg_type where typname = 'muscle_group') then
    create type muscle_group as enum (
      'chest','back','legs','shoulders','biceps','triceps','glutes','core','full-body','other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'set_kind') then
    create type set_kind as enum ('warmup','recognition','working');
  end if;
end$$;

-- Util: trigger de updated_at
create or replace function public.trigger_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Perfis (username local)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_timestamp_profiles
before update on public.profiles
for each row execute function public.trigger_set_timestamp();

-- Exercícios
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  muscle_group muscle_group not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists idx_exercises_user on public.exercises(user_id);
create trigger set_timestamp_exercises
before update on public.exercises
for each row execute function public.trigger_set_timestamp();

-- Templates
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists idx_templates_user on public.templates(user_id);
create trigger set_timestamp_templates
before update on public.templates
for each row execute function public.trigger_set_timestamp();

-- Exercícios de Template
create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position int not null default 0,
  sets int not null check (sets >= 0),
  reps int not null check (reps >= 0),
  load numeric(6,2) not null default 0,
  rest_sec int not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_template_exercises_template on public.template_exercises(template_id, position);
create index if not exists idx_template_exercises_user on public.template_exercises(user_id);
create trigger set_timestamp_template_exercises
before update on public.template_exercises
for each row execute function public.trigger_set_timestamp();

-- Histórico de Treinos (sessões)
create table if not exists public.workout_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_sec int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_histories_user_date on public.workout_histories(user_id, started_at desc);
create trigger set_timestamp_histories
before update on public.workout_histories
for each row execute function public.trigger_set_timestamp();

-- Exercícios executados na sessão
create table if not exists public.performed_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workout_histories(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  template_exercise_id uuid references public.template_exercises(id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_perf_ex_user_workout on public.performed_exercises(user_id, workout_id, position);
create trigger set_timestamp_perf_ex
before update on public.performed_exercises
for each row execute function public.trigger_set_timestamp();

-- Séries realizadas
create table if not exists public.performed_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  performed_exercise_id uuid not null references public.performed_exercises(id) on delete cascade,
  planned_reps int,
  planned_load numeric(6,2),
  reps int not null check (reps >= 0),
  load numeric(6,2) not null check (load >= 0),
  kind set_kind not null default 'working',
  done_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_perf_sets_exercise on public.performed_sets(performed_exercise_id, done_at);
create index if not exists idx_perf_sets_user on public.performed_sets(user_id);
create trigger set_timestamp_perf_sets
before update on public.performed_sets
for each row execute function public.trigger_set_timestamp();

-- RLS
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.workout_histories enable row level security;
alter table public.performed_exercises enable row level security;
alter table public.performed_sets enable row level security;

-- Políticas (princípio: cada usuário só enxerga/gera seus próprios dados)
create policy "Profiles are self-access" on public.profiles
  for select using (user_id = auth.uid());
create policy "Profiles self upsert" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "Profiles self update" on public.profiles
  for update using (user_id = auth.uid());

create policy "Exercises read own" on public.exercises
  for select using (user_id = auth.uid());
create policy "Exercises write own" on public.exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Templates read own" on public.templates
  for select using (user_id = auth.uid());
create policy "Templates write own" on public.templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "TemplateExercises read own" on public.template_exercises
  for select using (user_id = auth.uid());
create policy "TemplateExercises write own" on public.template_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Histories read own" on public.workout_histories
  for select using (user_id = auth.uid());
create policy "Histories write own" on public.workout_histories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "PerformedExercises read own" on public.performed_exercises
  for select using (user_id = auth.uid());
create policy "PerformedExercises write own" on public.performed_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "PerformedSets read own" on public.performed_sets
  for select using (user_id = auth.uid());
create policy "PerformedSets write own" on public.performed_sets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- (Opcional) Função utilitária para "Danger Zone" — apagar tudo do usuário
create or replace function public.purge_my_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.performed_sets where user_id = auth.uid();
  delete from public.performed_exercises where user_id = auth.uid();
  delete from public.workout_histories where user_id = auth.uid();
  delete from public.template_exercises where user_id = auth.uid();
  delete from public.templates where user_id = auth.uid();
  delete from public.exercises where user_id = auth.uid();
  delete from public.profiles where user_id = auth.uid();
end;
$$;

grant execute on function public.purge_my_data() to authenticated;

-- Função para buscar email pelo user_id (para login com username)
create or replace function public.get_user_email_by_id(user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
begin
  -- Busca o email do usuário na tabela auth.users
  select email into user_email
  from auth.users
  where id = user_id;

  return user_email;
end;
$$;

grant execute on function public.get_user_email_by_id(uuid) to authenticated;