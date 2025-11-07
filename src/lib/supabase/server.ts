import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerConfig } from '@/lib/config/env'

const config = getSupabaseServerConfig()

export const supabaseAdmin = createClient(config.url, config.serviceRoleKey)



