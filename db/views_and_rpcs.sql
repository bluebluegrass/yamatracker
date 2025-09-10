-- Database Views and RPCs for Hyakumeizan Tracker
-- Run this SQL in your Supabase SQL Editor

-- 1) Create helper: difficulty as int
create or replace view v_mountains as
select
  m.*,
  length(coalesce(m.difficulty, ''))::int as difficulty_int
from mountains m;

-- 2) The snapshot for the currently authenticated user
create or replace function dashboard_snapshot(p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  uid uuid := coalesce(p_user_id, auth.uid());
  _total int;
  _completed int;
  _completed_ids jsonb;
  _by_region jsonb;
  _by_difficulty jsonb;
  _badges jsonb;
begin
  select count(*) into _total from mountains;

  select count(*) into _completed
  from user_mountains um
  where um.user_id = uid;

  select coalesce(jsonb_agg(um.mountain_id), '[]'::jsonb) into _completed_ids
  from user_mountains um
  where um.user_id = uid;

  select coalesce(jsonb_agg(jsonb_build_object(
           'region', r.region,
           'total', r.total,
           'completed', coalesce(p.completed, 0)
         )), '[]'::jsonb)
  into _by_region
  from (
    select region, count(*)::int as total
    from mountains
    group by region
  ) r
  left join (
    select m.region, count(*)::int as completed
    from user_mountains um
    join mountains m on m.id = um.mountain_id
    where um.user_id = uid
    group by m.region
  ) p on p.region = r.region;

  select coalesce(jsonb_agg(jsonb_build_object(
           'level', d.difficulty_int,
           'total', d.total,
           'completed', coalesce(c.completed, 0)
         )), '[]'::jsonb)
  into _by_difficulty
  from (
    select difficulty_int, count(*)::int as total
    from v_mountains
    group by difficulty_int
  ) d
  left join (
    select vm.difficulty_int, count(*)::int as completed
    from user_mountains um
    join v_mountains vm on vm.id = um.mountain_id
    where um.user_id = uid
    group by vm.difficulty_int
  ) c on c.difficulty_int = d.difficulty_int;

  -- Simple badge logic; keep server-side for determinism
  _badges := '[]'::jsonb;
  if _completed >= 1  then _badges := _badges || jsonb_build_object('key','first_step'); end if;
  if _completed >= 10 then _badges := _badges || jsonb_build_object('key','ten_done');  end if;
  if _completed >= 50 then _badges := _badges || jsonb_build_object('key','half_way');  end if;
  if exists (
    select 1
    from user_mountains um
    join v_mountains vm on vm.id = um.mountain_id
    where um.user_id = uid and vm.difficulty_int = 5
  ) then _badges := _badges || jsonb_build_object('key','five_star_climber'); end if;

  return jsonb_build_object(
    'total', _total,
    'completed', _completed,
    'completed_ids', _completed_ids,
    'by_region', _by_region,
    'by_difficulty', _by_difficulty,
    'badges', _badges
  );
end $$;

grant execute on function dashboard_snapshot(uuid) to anon, authenticated;

-- 3) Toggle completion and return fresh snapshot
create or replace function toggle_completion(p_mountain_id text, p_mark boolean, p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
volatile
as $$
declare
  uid uuid := coalesce(p_user_id, auth.uid());
begin
  if uid is null then
    raise exception 'User ID is required. Either authenticate or provide p_user_id parameter.';
  end if;

  if p_mark then
    insert into user_mountains(user_id, mountain_id, completed_at, source)
    values (uid, p_mountain_id, now(), 'manual')
    on conflict (user_id, mountain_id) do nothing;
  else
    delete from user_mountains
    where user_id = uid and mountain_id = p_mountain_id;
  end if;

  -- Return the fresh, authoritative snapshot
  return dashboard_snapshot(uid);
end $$;

grant execute on function toggle_completion(text, boolean, uuid) to authenticated;

-- 4) Add helpful indexes if missing
create index if not exists idx_um_user on user_mountains(user_id);
create index if not exists idx_um_mountain on user_mountains(mountain_id);
