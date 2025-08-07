-- Seed default exercises for all existing users
with default_exercises(name, muscle_group) as (
  values
    ('Supino reto','chest'),
    ('Supino inclinado','chest'),
    ('Crucifixo','chest'),
    ('Puxada na frente','back'),
    ('Barra fixa','back'),
    ('Remada curvada','back'),
    ('Remada baixa','back'),
    ('Remada cavalinho','back'),
    ('Agachamento livre','legs'),
    ('Leg press','legs'),
    ('Extensão de pernas','legs'),
    ('Mesa flexora','legs'),
    ('Elevação de panturrilha','legs'),
    ('Elevação lateral','shoulders'),
    ('Desenvolvimento militar','shoulders'),
    ('Rosca direta','biceps'),
    ('Rosca alternada','biceps'),
    ('Tríceps testa','triceps'),
    ('Tríceps corda','triceps'),
    ('Levantamento terra','full-body'),
    ('Abdominal crunch','core'),
    ('Hip thrust','glutes'),
    ('Glute bridge','glutes')
)
insert into public.exercises (user_id, name, muscle_group)
select u.id, d.name, d.muscle_group::muscle_group
from auth.users u
cross join default_exercises d
on conflict (user_id, name) do nothing;

-- Optional: auto-seed for new users
create or replace function public.handle_new_user_seed_exercises()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.exercises (user_id, name, muscle_group)
  select new.id, d.name, d.muscle_group::muscle_group
  from (
    values
      ('Supino reto','chest'),
      ('Supino inclinado','chest'),
      ('Crucifixo','chest'),
      ('Puxada na frente','back'),
      ('Barra fixa','back'),
      ('Remada curvada','back'),
      ('Remada baixa','back'),
      ('Remada cavalinho','back'),
      ('Agachamento livre','legs'),
      ('Leg press','legs'),
      ('Extensão de pernas','legs'),
      ('Mesa flexora','legs'),
      ('Elevação de panturrilha','legs'),
      ('Elevação lateral','shoulders'),
      ('Desenvolvimento militar','shoulders'),
      ('Rosca direta','biceps'),
      ('Rosca alternada','biceps'),
      ('Tríceps testa','triceps'),
      ('Tríceps corda','triceps'),
      ('Levantamento terra','full-body'),
      ('Abdominal crunch','core'),
      ('Hip thrust','glutes'),
      ('Glute bridge','glutes')
  ) as d(name, muscle_group)
  on conflict (user_id, name) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_exercises on auth.users;
create trigger on_auth_user_created_seed_exercises
after insert on auth.users
for each row execute function public.handle_new_user_seed_exercises();
