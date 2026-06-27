'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/store'

export function useAuth() {
  const setUser = useStore(s => s.setUser)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])
}
