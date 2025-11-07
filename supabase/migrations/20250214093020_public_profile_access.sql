-- Migration: Public profile access
-- Description: Adds public profile fields and RPC for slug-based lookup with RLS safety.

-- Ensure optional profile fields exist on users table
alter table public.users
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists is_public boolean default true;

-- Keep existing rows public by default
update public.users
set is_public = coalesce(is_public, true);

-- View exposing only safe public fields
create or replace view public.v_public_profiles as
select
  u.slug,
  coalesce(nullif(u.display_name, ''), u.username) as display_name,
  u.avatar_url,
  u.created_at,
  coalesce(u.is_public, true) as is_public
from public.users u;

-- Public RPC that respects visibility while bypassing RLS on users
create or replace function public.get_public_profile_by_slug(p_slug text)
returns table (
  slug text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  is_public boolean
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  select
    v.slug,
    v.display_name,
    v.avatar_url,
    v.created_at,
    v.is_public
  from public.v_public_profiles v
  where v.slug = p_slug
    and v.is_public = true
  limit 1;
end;
$$;

-- Grant access via the view + RPC
grant select on public.v_public_profiles to authenticated;

grant execute on function public.get_public_profile_by_slug(text) to anon;
grant execute on function public.get_public_profile_by_slug(text) to authenticated;
