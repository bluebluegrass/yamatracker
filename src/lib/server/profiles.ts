import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicProfile } from '@/types/profile';
import type { Database } from '@/types/supabase';

const RPC_GET_PUBLIC_PROFILE = 'get_public_profile_by_slug';

type AnyClient = SupabaseClient<Database>;

type PublicProfileRow = {
  slug: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  is_public: boolean;
};

function mapProfile(row: PublicProfileRow): PublicProfile {
  return {
    slug: row.slug,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    isPublic: row.is_public,
  };
}

export async function getPublicProfile(
  client: AnyClient,
  slug: string,
): Promise<PublicProfile | null> {
  const sanitized = slug.trim();
  if (!sanitized) {
    return null;
  }

  const { data, error } = await client.rpc(RPC_GET_PUBLIC_PROFILE as never, { p_slug: sanitized } as never);
  if (error) {
    throw new Error(`[${RPC_GET_PUBLIC_PROFILE}] ${error.message}`, { cause: error });
  }

  const row = (Array.isArray(data) ? data[0] : data) as PublicProfileRow | undefined;
  if (!row) {
    return null;
  }

  return mapProfile(row);
}
