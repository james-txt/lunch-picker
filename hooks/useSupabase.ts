import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export function useSupabase() {
  const [client, setClient] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      setClient(supabase)
    }
  }, [])

  return client
}
