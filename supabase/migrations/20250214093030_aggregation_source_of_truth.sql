-- Migration: Aggregation Source of Truth
-- Description: Adds authenticated aggregate views and public RPCs for region, difficulty, and altitude counts.

-- Authenticated aggregate views leverage RLS on user_mountains to scope results to auth.uid().
create or replace view public.v_user_region_counts as
with totals as (
  select region, count(*)::int as total
  from public.mountains
  group by region
),
user_completed as (
  select m.region, count(*)::int as completed
  from public.user_mountains um
  join public.mountains m on m.id = um.mountain_id
  where um.user_id = auth.uid()
  group by m.region
)
select
  t.region,
  t.total,
  coalesce(uc.completed, 0) as completed
from totals t
left join user_completed uc on uc.region = t.region
where auth.uid() is not null
order by t.region;

create or replace view public.v_user_difficulty_counts as
with totals as (
  select difficulty_int, count(*)::int as total
  from public.v_mountains
  group by difficulty_int
),
user_completed as (
  select vm.difficulty_int, count(*)::int as completed
  from public.user_mountains um
  join public.v_mountains vm on vm.id = um.mountain_id
  where um.user_id = auth.uid()
  group by vm.difficulty_int
)
select
  t.difficulty_int as difficulty,
  t.total,
  coalesce(uc.completed, 0) as completed
from totals t
left join user_completed uc on uc.difficulty_int = t.difficulty_int
where auth.uid() is not null
order by t.difficulty_int;

create or replace view public.v_user_altitude_counts as
with user_completed as (
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
  where um.user_id = auth.uid()
  group by 1
)
select
  b.bucket_id,
  b.bucket_label as label,
  b.min_elevation_m as min,
  b.max_elevation_m as max,
  b.total,
  coalesce(uc.completed, 0) as completed
from public.v_altitude_buckets b
left join user_completed uc on uc.bucket_id = b.bucket_id
where auth.uid() is not null
order by b.min_elevation_m nulls first;

-- Helper to get a public user id by slug (returns null if slug is private or missing).
create or replace function public._get_public_user_id(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.slug = p_slug
    and coalesce(u.is_public, true) = true
  limit 1;
$$;

-- Authenticated RPCs (auth.uid() scoped) ---------------------------------------------------
create or replace function public.get_region_counts()
returns table (
  region text,
  total int,
  completed int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Missing auth context' using errcode = '42501';
  end if;

  return query
  select
    t.region,
    t.total,
    coalesce(c.completed, 0) as completed
  from (
    select m.region, count(*)::int as total
    from public.mountains m
    group by m.region
  ) t
  left join (
    select m.region, count(*)::int as completed
    from public.user_mountains um
    join public.mountains m on m.id = um.mountain_id
    where um.user_id = uid
    group by m.region
  ) c on c.region = t.region
  order by t.region;
end;
$$;

create or replace function public.get_difficulty_counts()
returns table (
  difficulty int,
  total int,
  completed int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Missing auth context' using errcode = '42501';
  end if;

  return query
  select
    t.difficulty_int,
    t.total,
    coalesce(c.completed, 0) as completed
  from (
    select vm.difficulty_int, count(*)::int as total
    from public.v_mountains vm
    group by vm.difficulty_int
  ) t
  left join (
    select vm.difficulty_int, count(*)::int as completed
    from public.user_mountains um
    join public.v_mountains vm on vm.id = um.mountain_id
    where um.user_id = uid
    group by vm.difficulty_int
  ) c on c.difficulty_int = t.difficulty_int
  order by t.difficulty_int;
end;
$$;

create or replace function public.get_altitude_counts()
returns table (
  bucket_id text,
  label text,
  min int,
  max int,
  total int,
  completed int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Missing auth context' using errcode = '42501';
  end if;

  return query
  select
    b.bucket_id,
    b.bucket_label,
    b.min_elevation_m,
    b.max_elevation_m,
    b.total,
    coalesce(c.completed, 0) as completed
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
  ) c on c.bucket_id = b.bucket_id
  order by b.min_elevation_m nulls first;
end;
$$;

-- Public RPCs by slug (only return data for users flagged public) --------------------------
create or replace function public.get_public_region_counts(p_slug text)
returns table (
  region text,
  total int,
  completed int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select public._get_public_user_id(p_slug) into target_id;
  if target_id is null then
    return;
  end if;

  return query
  select
    t.region,
    t.total,
    coalesce(c.completed, 0) as completed
  from (
    select m.region, count(*)::int as total
    from public.mountains m
    group by m.region
  ) t
  left join (
    select m.region, count(*)::int as completed
    from public.user_mountains um
    join public.mountains m on m.id = um.mountain_id
    where um.user_id = target_id
    group by m.region
  ) c on c.region = t.region
  order by t.region;
end;
$$;

create or replace function public.get_public_difficulty_counts(p_slug text)
returns table (
  difficulty int,
  total int,
  completed int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select public._get_public_user_id(p_slug) into target_id;
  if target_id is null then
    return;
  end if;

  return query
  select
    t.difficulty_int,
    t.total,
    coalesce(c.completed, 0) as completed
  from (
    select vm.difficulty_int, count(*)::int as total
    from public.v_mountains vm
    group by vm.difficulty_int
  ) t
  left join (
    select vm.difficulty_int, count(*)::int as completed
    from public.user_mountains um
    join public.v_mountains vm on vm.id = um.mountain_id
    where um.user_id = target_id
    group by vm.difficulty_int
  ) c on c.difficulty_int = t.difficulty_int
  order by t.difficulty_int;
end;
$$;

create or replace function public.get_public_altitude_counts(p_slug text)
returns table (
  bucket_id text,
  label text,
  min int,
  max int,
  total int,
  completed int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select public._get_public_user_id(p_slug) into target_id;
  if target_id is null then
    return;
  end if;

  return query
  select
    b.bucket_id,
    b.bucket_label,
    b.min_elevation_m,
    b.max_elevation_m,
    b.total,
    coalesce(c.completed, 0) as completed
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
    where um.user_id = target_id
    group by 1
  ) c on c.bucket_id = b.bucket_id
  order by b.min_elevation_m nulls first;
end;
$$;

-- Grants -----------------------------------------------------------------------------------
grant select on public.v_user_region_counts to authenticated;
grant select on public.v_user_difficulty_counts to authenticated;
grant select on public.v_user_altitude_counts to authenticated;

grant execute on function public.get_region_counts() to authenticated;
grant execute on function public.get_difficulty_counts() to authenticated;
grant execute on function public.get_altitude_counts() to authenticated;

grant execute on function public.get_public_region_counts(text) to anon, authenticated;
grant execute on function public.get_public_difficulty_counts(text) to anon, authenticated;
grant execute on function public.get_public_altitude_counts(text) to anon, authenticated;

grant execute on function public._get_public_user_id(text) to authenticated;
revoke execute on function public._get_public_user_id(text) from public;
