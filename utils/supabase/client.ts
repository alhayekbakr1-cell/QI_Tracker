import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Single typed, browser-side Supabase client — safe for static export / GitHub Pages
let clientInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  if (clientInstance) return clientInstance
  clientInstance = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return clientInstance
}
