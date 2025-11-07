\set ON_ERROR_STOP on

begin;

truncate table public.user_mountains restart identity cascade;
truncate table public.mountains restart identity cascade;
truncate table public.users restart identity cascade;

insert into public.mountains (id, name_ja, name_en, name_zh, region, prefecture, difficulty, elevation_m)
values
  ('mt_fuji', 'Fuji', 'Mount Fuji', 'Fuji ZH', 'Chubu', 'Yamanashi', '*****', 3776),
  ('mt_tsurugi', 'Tsurugi', 'Mount Tsurugi', 'Tsurugi ZH', 'Chubu', 'Toyama', '****', 2999),
  ('mt_shirane', 'Shirane', 'Mount Shirane', 'Shirane ZH', 'Kanto', 'Gunma', '***', 2578),
  ('mt_tsukuba', 'Tsukuba', 'Mount Tsukuba', 'Tsukuba ZH', 'Kanto', 'Ibaraki', '*', 877);

insert into public.users (id, username, slug, display_name, avatar_url, is_public)
values
  ('00000000-0000-0000-0000-000000000001', 'public_user', 'public-slug', 'Public User', 'https://example.com/public.png', true),
  ('00000000-0000-0000-0000-000000000002', 'private_user', 'private-slug', 'Private User', 'https://example.com/private.png', false);

insert into public.user_mountains (user_id, mountain_id, completed_at)
values
  ('00000000-0000-0000-0000-000000000001', 'mt_fuji', now()),
  ('00000000-0000-0000-0000-000000000001', 'mt_tsukuba', now()),
  ('00000000-0000-0000-0000-000000000002', 'mt_tsurugi', now());

-- Authenticated views should scope counts to auth.uid().
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

do $$
declare
  chubu record;
  kanto record;
begin
  select * into chubu from public.v_user_region_counts where region = 'Chubu';
  if chubu.total <> 2 or chubu.completed <> 1 then
    raise exception 'Unexpected Chubu counts: total %, completed %', chubu.total, chubu.completed;
  end if;

  select * into kanto from public.v_user_region_counts where region = 'Kanto';
  if kanto.total <> 2 or kanto.completed <> 1 then
    raise exception 'Unexpected Kanto counts: total %, completed %', kanto.total, kanto.completed;
  end if;
end
$$;

do $$
declare
  diff3 record;
  diff5 record;
begin
  select * into diff3 from public.v_user_difficulty_counts where difficulty = 3;
  if diff3.total <> 1 or diff3.completed <> 0 then
    raise exception 'Difficulty 3 expected total 1 completed 0, got %/%', diff3.total, diff3.completed;
  end if;

  select * into diff5 from public.v_user_difficulty_counts where difficulty = 5;
  if diff5.total <> 1 or diff5.completed <> 1 then
    raise exception 'Difficulty 5 expected total 1 completed 1, got %/%', diff5.total, diff5.completed;
  end if;
end
$$;

do $$
declare
  low record;
  high record;
begin
  select * into low from public.v_user_altitude_counts where bucket_id = 'lt_1000';
  if low.total <> 1 or low.completed <> 1 then
    raise exception 'Altitude lt_1000 expected total 1 completed 1, got %/%', low.total, low.completed;
  end if;

  select * into high from public.v_user_altitude_counts where bucket_id = 'gte_3000';
  if high.total <> 1 or high.completed <> 1 then
    raise exception 'Altitude gte_3000 expected total 1 completed 1, got %/%', high.total, high.completed;
  end if;
end
$$;

-- Authenticated RPCs should mirror the view results.
do $$
declare
  total_completed int;
begin
  select sum(completed) into total_completed from public.get_region_counts();
  if total_completed <> 2 then
    raise exception 'Expected total completed regions sum 2, got %', total_completed;
  end if;
end
$$;

-- Changing a completion should update aggregates immediately.
insert into public.user_mountains (user_id, mountain_id, completed_at)
values ('00000000-0000-0000-0000-000000000001', 'mt_shirane', now());

do $$
declare
  kanto record;
  diff3 record;
begin
  select * into kanto from public.get_region_counts() where region = 'Kanto';
  if kanto.completed <> 2 then
    raise exception 'After new completion expected Kanto completed 2, got %', kanto.completed;
  end if;

  select * into diff3 from public.get_difficulty_counts() where difficulty = 3;
  if diff3.completed <> 1 then
    raise exception 'After new completion expected difficulty 3 completed 1, got %', diff3.completed;
  end if;
end
$$;

reset role;
reset "request.jwt.claim.sub";
reset "request.jwt.claim.role";

-- Public RPCs should return the same aggregates by slug when profile is public.
set local role anon;
set local "request.jwt.claim.role" = 'anon';

do $$
declare
  totals int;
begin
  select sum(completed) into totals from public.get_public_region_counts('public-slug');
  if totals <> 3 then
    raise exception 'Public region counts expected sum 3, got %', totals;
  end if;
end
$$;

do $$
declare
  row_count int;
begin
  select count(*) into row_count from public.get_public_region_counts('private-slug');
  if row_count <> 0 then
    raise exception 'Private slug should return 0 rows, got %', row_count;
  end if;
end
$$;

rollback;
