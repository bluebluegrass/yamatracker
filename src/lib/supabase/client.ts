import { createClient } from '@supabase/supabase-js'
import { getSupabaseClientConfig } from '@/lib/config/env'

const config = getSupabaseClientConfig()

export const supabase = createClient(config.url, config.anonKey)



