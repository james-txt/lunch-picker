import { createClient } from '@supabase/supabase-js'

// Only initialize client if we're in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string


export const supabase = createClient(supabaseUrl, supabaseAnonKey)