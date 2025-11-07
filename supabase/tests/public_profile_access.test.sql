\set ON_ERROR_STOP on

begin;

truncate table public.user_mountains restart identity cascade;
truncate table public.users restart identity cascade;

insert into public.users (id, username, slug, display_name, avatar_url, is_public)
values
  ('00000000-0000-0000-0000-000000000001', 'public_user', 'public-slug', 'Public Person', 'https://example.com/public.png', true),
  ('00000000-0000-0000-0000-000000000002', 'private_user', 'private-slug', null, 'https://example.com/private.png', false),
  ('00000000-0000-0000-0000-000000000003', 'default_user', 'default-public', '', null, default);

-- View should fall back to username when display_name is missing or blank.
do $$
declare
  fallback_name text;
begin
  select display_name into fallback_name
  from public.v_public_profiles
  where slug = 'private-slug';

  if fallback_name is distinct from 'private_user' then
    raise exception 'Expected fallback display_name private_user, got %', fallback_name;
  end if;
end
$$;

-- Public user should be returned with the same fields as the view exposes.
do $$
declare
  profile record;
begin
  select * into profile
  from public.get_public_profile_by_slug('public-slug');

  if not found then
    raise exception 'Expected public profile for slug public-slug';
  end if;

  if profile.display_name is distinct from 'Public Person' then
    raise exception 'Unexpected display_name: %', profile.display_name;
  end if;

  if profile.avatar_url is distinct from 'https://example.com/public.png' then
    raise exception 'Unexpected avatar_url: %', profile.avatar_url;
  end if;

  if profile.is_public is distinct from true then
    raise exception 'Expected is_public to be true';
  end if;
end
$$;

-- Default visibility should be true when not explicitly provided.
do $$
declare
  profile record;
begin
  select * into profile
  from public.get_public_profile_by_slug('default-public');

  if not found then
    raise exception 'Expected default public profile for slug default-public';
  end if;

  if profile.display_name is distinct from 'default_user' then
    raise exception 'Expected default display name to fall back to username';
  end if;

  if profile.is_public is distinct from true then
    raise exception 'Expected default is_public to be true';
  end if;
end
$$;

-- Private users must be filtered out of the RPC response.
do $$
declare
  profile_count integer;
begin
  select count(*) into profile_count
  from public.get_public_profile_by_slug('private-slug');

  if profile_count <> 0 then
    raise exception 'Private profile was returned by RPC';
  end if;
end
$$;

-- Anon role should see zero rows when scanning users directly.
do $$
declare
  visible_count integer;
begin
  execute 'set local role anon';
  execute 'select count(*) from public.users' into visible_count;
  execute 'reset role';

  if visible_count <> 0 then
    raise exception 'Anon role can see % user rows', visible_count;
  end if;
end
$$;

-- Anon role should be able to call the RPC and only receive allowed fields.
do $$
declare
  profile record;
begin
  execute 'set local role anon';
  execute 'select slug, display_name, avatar_url, created_at, is_public
           from public.get_public_profile_by_slug(''public-slug'')' into profile;
  execute 'reset role';

  if profile.slug is null then
    raise exception 'Anon RPC call returned no rows for public slug';
  end if;

  if profile.display_name is distinct from 'Public Person' then
    raise exception 'Anon RPC returned unexpected display_name: %', profile.display_name;
  end if;

  if profile.is_public is distinct from true then
    raise exception 'Anon RPC expected is_public true';
  end if;
end
$$;

rollback;
