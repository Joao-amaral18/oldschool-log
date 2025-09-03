-- Migration: Enhanced Offline & Session Management
-- Date: 2025-03-09
-- Description: Adds support for better offline functionality, session persistence, and cross-device sync

-- 1. Session State Table (for cross-device synchronization)
create table if not exists public.session_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workout_histories(id) on delete cascade,
  device_id text not null, -- Unique identifier for the device
  session_data jsonb not null, -- Full session state as JSON
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_id, device_id)
);

-- Indexes for session states
create index if not exists idx_session_states_user_workout on public.session_states(user_id, workout_id);
create index if not exists idx_session_states_updated on public.session_states(last_updated desc);
create index if not exists idx_session_states_device on public.session_states(device_id);

-- Trigger for session states
create trigger set_timestamp_session_states
before update on public.session_states
for each row execute function public.trigger_set_timestamp();

-- 2. Offline Operations Queue (database-backed queue)
create table if not exists public.offline_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  device_id text not null,
  operation_type text not null, -- 'create', 'update', 'delete'
  entity_type text not null, -- 'performed_set', 'performed_exercise', etc.
  entity_id uuid,
  operation_data jsonb not null,
  priority int not null default 0, -- Higher priority = process first
  status text not null default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count int not null default 0,
  max_retries int not null default 3,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

-- Indexes for offline operations
create index if not exists idx_offline_ops_user_status on public.offline_operations(user_id, status);
create index if not exists idx_offline_ops_priority on public.offline_operations(priority desc, created_at asc);
create index if not exists idx_offline_ops_device on public.offline_operations(device_id, status);
create index if not exists idx_offline_ops_entity on public.offline_operations(entity_type, entity_id);

-- Trigger for offline operations
create trigger set_timestamp_offline_operations
before update on public.offline_operations
for each row execute function public.trigger_set_timestamp();

-- 3. Device Synchronization Status
create table if not exists public.device_sync_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  device_id text not null,
  device_name text,
  last_sync_at timestamptz,
  sync_version bigint not null default 0,
  is_online boolean not null default true,
  capabilities jsonb, -- Device capabilities (PWA support, etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);

-- Indexes for device sync status
create index if not exists idx_device_sync_user on public.device_sync_status(user_id);
create index if not exists idx_device_sync_online on public.device_sync_status(is_online, last_sync_at desc);

-- Trigger for device sync status
create trigger set_timestamp_device_sync_status
before update on public.device_sync_status
for each row execute function public.trigger_set_timestamp();

-- 4. Conflict Resolution Table
create table if not exists public.sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  device_id text not null,
  local_version jsonb not null,
  remote_version jsonb not null,
  conflict_type text not null, -- 'version_conflict', 'deletion_conflict', etc.
  resolution_strategy text, -- 'local_wins', 'remote_wins', 'merge', 'manual'
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for sync conflicts
create index if not exists idx_sync_conflicts_user on public.sync_conflicts(user_id, created_at desc);
create index if not exists idx_sync_conflicts_entity on public.sync_conflicts(entity_type, entity_id);
create index if not exists idx_sync_conflicts_resolved on public.sync_conflicts(resolved_at);

-- Trigger for sync conflicts
create trigger set_timestamp_sync_conflicts
before update on public.sync_conflicts
for each row execute function public.trigger_set_timestamp();

-- 5. Enable RLS for new tables
alter table public.session_states enable row level security;
alter table public.offline_operations enable row level security;
alter table public.device_sync_status enable row level security;
alter table public.sync_conflicts enable row level security;

-- 6. RLS Policies for new tables
create policy "SessionStates read own" on public.session_states
  for select using (user_id = auth.uid());
create policy "SessionStates write own" on public.session_states
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "OfflineOperations read own" on public.offline_operations
  for select using (user_id = auth.uid());
create policy "OfflineOperations write own" on public.offline_operations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "DeviceSyncStatus read own" on public.device_sync_status
  for select using (user_id = auth.uid());
create policy "DeviceSyncStatus write own" on public.device_sync_status
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "SyncConflicts read own" on public.sync_conflicts
  for select using (user_id = auth.uid());
create policy "SyncConflicts write own" on public.sync_conflicts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 7. Function to clean up old session states (older than 30 days)
create or replace function public.cleanup_old_session_states()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.session_states
  where last_updated < now() - interval '30 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.cleanup_old_session_states() to authenticated;

-- 8. Function to clean up processed offline operations (older than 7 days)
create or replace function public.cleanup_processed_operations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.offline_operations
  where status in ('completed', 'failed')
    and processed_at < now() - interval '7 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.cleanup_processed_operations() to authenticated;

-- 9. Function to get device sync status
create or replace function public.get_device_sync_status(device_id_param text)
returns table (
  device_name text,
  last_sync_at timestamptz,
  sync_version bigint,
  is_online boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    dss.device_name,
    dss.last_sync_at,
    dss.sync_version,
    dss.is_online
  from public.device_sync_status dss
  where dss.user_id = auth.uid()
    and dss.device_id = device_id_param;
end;
$$;

grant execute on function public.get_device_sync_status(text) to authenticated;

-- 10. Function to update device sync status
create or replace function public.update_device_sync_status(
  device_id_param text,
  device_name_param text default null,
  is_online_param boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  device_sync_id uuid;
begin
  insert into public.device_sync_status (
    user_id,
    device_id,
    device_name,
    last_sync_at,
    is_online
  ) values (
    auth.uid(),
    device_id_param,
    device_name_param,
    now(),
    is_online_param
  )
  on conflict (user_id, device_id)
  do update set
    device_name = coalesce(excluded.device_name, device_sync_status.device_name),
    last_sync_at = now(),
    is_online = excluded.is_online,
    sync_version = device_sync_status.sync_version + 1,
    updated_at = now()
  returning id into device_sync_id;

  return device_sync_id;
end;
$$;

grant execute on function public.update_device_sync_status(text, text, boolean) to authenticated;

-- 11. Function to save session state
create or replace function public.save_session_state(
  workout_id_param uuid,
  device_id_param text,
  session_data_param jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  session_state_id uuid;
begin
  insert into public.session_states (
    user_id,
    workout_id,
    device_id,
    session_data,
    last_updated
  ) values (
    auth.uid(),
    workout_id_param,
    device_id_param,
    session_data_param,
    now()
  )
  on conflict (user_id, workout_id, device_id)
  do update set
    session_data = excluded.session_data,
    last_updated = now(),
    updated_at = now()
  returning id into session_state_id;

  return session_state_id;
end;
$$;

grant execute on function public.save_session_state(uuid, text, jsonb) to authenticated;

-- 12. Function to get latest session state
create or replace function public.get_latest_session_state(workout_id_param uuid)
returns table (
  device_id text,
  session_data jsonb,
  last_updated timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    ss.device_id,
    ss.session_data,
    ss.last_updated
  from public.session_states ss
  where ss.user_id = auth.uid()
    and ss.workout_id = workout_id_param
  order by ss.last_updated desc
  limit 1;
end;
$$;

grant execute on function public.get_latest_session_state(uuid) to authenticated;

-- 13. Add some performance indexes to existing tables
create index if not exists idx_workout_histories_user_finished on public.workout_histories(user_id, finished_at desc nulls last);
create index if not exists idx_performed_sets_done_at on public.performed_sets(done_at desc);
create index if not exists idx_performed_exercises_workout_position on public.performed_exercises(workout_id, position);

-- 14. Comments for documentation
comment on table public.session_states is 'Stores session state for cross-device synchronization';
comment on table public.offline_operations is 'Database-backed queue for offline operations';
comment on table public.device_sync_status is 'Tracks device synchronization status';
comment on table public.sync_conflicts is 'Stores synchronization conflicts for resolution';

comment on function public.cleanup_old_session_states() is 'Removes session states older than 30 days';
comment on function public.cleanup_processed_operations() is 'Removes processed offline operations older than 7 days';
comment on function public.get_device_sync_status(text) is 'Gets sync status for a specific device';
comment on function public.update_device_sync_status(text, text, boolean) is 'Updates or creates device sync status';
comment on function public.save_session_state(uuid, text, jsonb) is 'Saves session state for a workout';
comment on function public.get_latest_session_state(uuid) is 'Gets the most recent session state for a workout';
