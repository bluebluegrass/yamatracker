architecture.md — Debug-Friendly (Supabase-first)
The problem we’re solving

Multiple components (Checklist, Difficulty, Badges, Region tiles, Overall) each fetch/derive data separately → race conditions and stale state after toggles.

High-level solution

Single Source of Truth: Supabase.

Single Snapshot: fetch one “dashboard snapshot” that already contains everything the UI needs.

Atomic Mutation: toggling a mountain updates DB and returns a fresh snapshot in the same transaction.

One Store: a client provider keeps the latest snapshot in memory; all components read from it (no component does its own fetch/derive).

Data contracts (server)

We will create two RPCs that rely on auth.uid() (no user id spoofing):

dashboard_snapshot() → returns a JSONB snapshot:

-- 1) Create helper: difficulty as int
create or replace view v_mountains as
select
  m.*,
  length(coalesce(m.difficulty, ''))::int as difficulty_int
from mountains m;

-- 2) The snapshot for the currently authenticated user
create or replace function dashboard_snapshot()
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  uid uuid := auth.uid();
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
  ) p on p.region = r.region
  order by r.region;

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
  ) c on c.difficulty_int = d.difficulty_int
  order by d.difficulty_int;

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

grant execute on function dashboard_snapshot() to anon, authenticated;


toggle_completion(mountain_id uuid/text, mark boolean) → writes and returns a fresh snapshot:

create or replace function toggle_completion(p_mountain_id text, p_mark boolean)
returns jsonb
language plpgsql
security definer
volatile
as $$
declare
  uid uuid := auth.uid();
begin
  if p_mark then
    insert into user_mountains(user_id, mountain_id, completed_at, source)
    values (uid, p_mountain_id, now(), 'manual')
    on conflict (user_id, mountain_id) do nothing;
  else
    delete from user_mountains
    where user_id = uid and mountain_id = p_mountain_id;
  end if;

  -- Return the fresh, authoritative snapshot
  return dashboard_snapshot();
end $$;

grant execute on function toggle_completion(text, boolean) to authenticated;


Why this works: every UI render and every toggle uses the same aggregate, so Difficulty, Badges, RegionTiles, and Checklist cannot drift.

Frontend data flow (Next.js App Router)
[Server Component: dashboard/page.tsx]
    └─ fetch snapshot (supabase.rpc('dashboard_snapshot'))
    └─ <DashboardProvider initialSnapshot=...>  (client)
          ├─ <ProgressOverview/>  reads from context
          │     ├─ <DifficultyBreakdown/>
          │     └─ <BadgeDisplay/>
          ├─ <TwoPane>
          │     ├─ <ChecklistSidebar onToggle=actions.toggle/>
          │     └─ <RegionTiles/>
          └─ <FooterProgress/>

Client store (Context)

Holds the current snapshot.

Actions:

toggle(mountainId, mark) → calls toggle_completion RPC → replace snapshot in store.

TypeScript contract for the snapshot
export type RegionStat = { region: string; total: number; completed: number };
export type DifficultyStat = { level: number | null; total: number; completed: number };

export type DashboardSnapshot = {
  total: number;
  completed: number;
  completed_ids: string[];         // mountain ids
  by_region: RegionStat[];
  by_difficulty: DifficultyStat[]; // levels 0..5; null if missing
  badges: { key: 'first_step'|'ten_done'|'half_way'|'five_star_climber' }[];
};

Minimal client utilities
// lib/supabase/api.ts
export async function getSnapshot(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('dashboard_snapshot');
  if (error) throw error;
  return data as DashboardSnapshot;
}

export async function toggleAndGetSnapshot(supabase: SupabaseClient, id: string, mark: boolean) {
  const { data, error } = await supabase.rpc('toggle_completion', { p_mountain_id: id, p_mark: mark });
  if (error) throw error;
  return data as DashboardSnapshot;
}

Debug-first design choices

One fetch / one mutation contract → eliminates cross-component drift.

Server computes difficulty/region/badges → deterministic, testable in SQL.

Context replaces snapshot wholesale after each toggle → no partial merges.

Logging hooks (feature flag) print: RPC inputs, RPC duration, and snapshot’s completed count.