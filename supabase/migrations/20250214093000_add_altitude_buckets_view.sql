-- Migration: Add altitude bucket view and extend dashboard snapshot
-- Description: Provides altitude aggregates for mountains and returns them in the snapshot payload.

create or replace view public.v_altitude_buckets as
with buckets as (
  select * from (values
    ('lt_1000', '<1,000 m', null::integer, 1000),
    ('1000_1999', '1,000 – 1,999 m', 1000, 2000),
    ('2000_2999', '2,000 – 2,999 m', 2000, 3000),
    ('gte_3000', '≥3,000 m', 3000, null::integer)
  ) as b(bucket_id, bucket_label, min_elevation_m, max_elevation_m)
)
select
  b.bucket_id,
  b.bucket_label,
  b.min_elevation_m,
  b.max_elevation_m,
  count(m.id)::int as total
from buckets b
left join public.mountains m
  on (b.min_elevation_m is null or m.elevation_m >= b.min_elevation_m)
 and (b.max_elevation_m is null or m.elevation_m < b.max_elevation_m)
group by b.bucket_id, b.bucket_label, b.min_elevation_m, b.max_elevation_m
order by b.min_elevation_m nulls first;

create or replace function public.dashboard_snapshot(p_user_id uuid default null)
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
  _by_altitude jsonb;
  _badges jsonb;
begin
  select count(*) into _total from public.mountains;

  select count(*) into _completed
  from public.user_mountains um
  where um.user_id = uid;

  select coalesce(jsonb_agg(um.mountain_id), '[]'::jsonb) into _completed_ids
  from public.user_mountains um
  where um.user_id = uid;

  select coalesce(jsonb_agg(jsonb_build_object(
           'region', r.region,
           'total', r.total,
           'completed', coalesce(p.completed, 0)
         )), '[]'::jsonb)
  into _by_region
  from (
    select region, count(*)::int as total
    from public.mountains
    group by region
  ) r
  left join (
    select m.region, count(*)::int as completed
    from public.user_mountains um
    join public.mountains m on m.id = um.mountain_id
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
    from public.v_mountains
    group by difficulty_int
  ) d
  left join (
    select vm.difficulty_int, count(*)::int as completed
    from public.user_mountains um
    join public.v_mountains vm on vm.id = um.mountain_id
    where um.user_id = uid
    group by vm.difficulty_int
  ) c on c.difficulty_int = d.difficulty_int;

  select coalesce(jsonb_agg(jsonb_build_object(
           'bucket_id', b.bucket_id,
           'label', b.bucket_label,
           'min', b.min_elevation_m,
           'max', b.max_elevation_m,
           'total', b.total,
           'completed', coalesce(c.completed, 0)
         ) order by b.min_elevation_m nulls first), '[]'::jsonb)
  into _by_altitude
  from public.v_altitude_buckets b
  left join (
    select
      case
        when m.elevation_m < 1000 then 'lt_1000'
        when m.elevation_m >= 1000 and m.elevation_m < 2000 then '1000_1999'
        when m.elevation_m >= 2000 and m.elevation_m < 3000 then '2000_2999'
        else 'gte_3000'
      end as bucket_id,
      count(*)::int as completed
    from public.user_mountains um
    join public.mountains m on m.id = um.mountain_id
    where um.user_id = uid
    group by 1
  ) c on c.bucket_id = b.bucket_id;

  _badges := '[]'::jsonb;
  if _completed >= 1  then _badges := _badges || jsonb_build_object('key','first_step'); end if;
  if _completed >= 10 then _badges := _badges || jsonb_build_object('key','ten_done');  end if;
  if _completed >= 50 then _badges := _badges || jsonb_build_object('key','half_way');  end if;
  if exists (
    select 1
    from public.user_mountains um
    join public.v_mountains vm on vm.id = um.mountain_id
    where um.user_id = uid and vm.difficulty_int = 5
  ) then _badges := _badges || jsonb_build_object('key','five_star_climber'); end if;

  return jsonb_build_object(
    'total', _total,
    'completed', _completed,
    'completed_ids', _completed_ids,
    'by_region', _by_region,
    'by_difficulty', _by_difficulty,
    'by_altitude', _by_altitude,
    'badges', _badges
  );
end $$;

grant execute on function public.dashboard_snapshot(uuid) to anon, authenticated;
