'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { createSession, getSession } from '@/lib/api'

export function useSession() {
  const { sessionId, setSessionId, setAnalysis, setAnalysisReady } = useStore()
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (sessionId) return
    createSession()
      .then((d) => setSessionId(d.session_id))
      .catch(() => {
        // Backend no disponible — modo demo sin crash
        console.warn('Backend no disponible en localhost:8000')
      })
  }, [])

  function startPolling(sid: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const data = await getSession(sid)
        if (data.analysis_ready) {
          clearInterval(pollRef.current!)
          setAnalysisReady(true)
          if (data.analysis) setAnalysis(data.analysis)
        }
      } catch {}
    }, 1200)
  }

  return { sessionId, startPolling }
}
