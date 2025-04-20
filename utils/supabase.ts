import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

function createSupabaseClient() {
  if (typeof window === 'undefined') return null
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  return supabaseInstance
}

export const getSupabase = () => {
  return createSupabaseClient()
}