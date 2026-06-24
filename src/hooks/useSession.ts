'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { createSession, getSession } from '@/lib/api'

export function useSession() {
  const { sessionId, setSessionId, setAnalysis, setAnalysisReady } = useStore()
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    createSession()
      .then((d) => {
        setSessionId(d.session_id)
        console.log('[DataBridge] Sesión creada:', d.session_id)
      })
      .catch((e) => {
        console.warn('[DataBridge] Backend no disponible en localhost:8000 —', e.message)
      })
  }, [])

  function startPolling(sid: string) {
    if (pollRef.current) clearInterval(pollRef.current)

    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > 60) {
        clearInterval(pollRef.current!)
        return
      }
      try {
        const data = await getSession(sid)
        if (data.analysis_ready) {
          clearInterval(pollRef.current!)
          setAnalysisReady(true)
          if (data.analysis) setAnalysis(data.analysis)
          console.log('[DataBridge] Análisis listo')
        }
      } catch (e) {
        console.warn('[DataBridge] Error polling:', e)
      }
    }, 1200)
  }

  return { sessionId, startPolling }
}
