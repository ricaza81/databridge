'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Header } from '@/components/ui/Header'
import { ProjectsPanel } from '@/components/sidebar/ProjectsPanel'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ChatInput } from '@/components/chat/ChatInput'
import { SaveSessionModal } from '@/components/ui/SaveSessionModal'
import { useStore } from '@/store'
import { useSession } from '@/hooks/useSession'
import { usePersistence } from '@/hooks/usePersistence'
import { streamChat, uploadFiles, checkHealth } from '@/lib/api'
import { ChatMessage } from '@/types'

export default function DashboardPage() {
  const { sessionId, startPolling } = useSession()
  const db = usePersistence()
  const {
    addMessage, updateLastMessage, setStreaming, isStreaming,
    analysisReady, addFile, updateFileStatus, analysis, files,
    messages, setMessages, clearMessages, clearFiles,
    activeProjectId, activeDbSessionId, setActiveDbSessionId,
    setAnalysis, setAnalysisReady, projects,
  } = useStore()

  const fileRef = useRef<HTMLInputElement>(null)
  const [backendOk, setBackendOk] = useState<boolean | null>(null)
  const autoAnalyzed = useRef(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<string[]>([])
  const lastMsgId = useRef<string | null>(null)

  // Health check
  useEffect(() => {
    checkHealth().then(ok => setBackendOk(ok))
  }, [])

  // Auto-analizar cuando el análisis esté listo
  useEffect(() => {
    if (analysisReady && !autoAnalyzed.current) {
      autoAnalyzed.current = true
      // Mostrar modal para guardar si hay proyectos
      if (projects.length > 0) {
        setPendingFiles(files.map(f => f.name))
        setShowSaveModal(true)
      }
      handleSend('Analiza los archivos que acabo de subir y dame el diagnóstico completo: fuentes detectadas, relaciones entre ellas, problemas de calidad y el modelo de integración propuesto.')
    }
  }, [analysisReady])

  // Guardar mensajes en Supabase cuando el streaming termina
  useEffect(() => {
    if (!activeDbSessionId || isStreaming || messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.id === lastMsgId.current) return
    lastMsgId.current = last.id
    db.saveMessage(activeDbSessionId, last).catch(console.error)
  }, [messages, isStreaming, activeDbSessionId])

  const handleSend = useCallback(async (text: string) => {
    if (!sessionId || isStreaming) return

    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text, timestamp: new Date() }
    addMessage(userMsg)

    // Guardar mensaje usuario si hay sesión activa
    if (activeDbSessionId) {
      db.saveMessage(activeDbSessionId, userMsg).catch(console.error)
    }

    setStreaming(true)

    const assistantMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: '', timestamp: new Date() }
    addMessage(assistantMsg)

    let fullText = ''
    try {
      for await (const chunk of streamChat(sessionId, text)) {
        if (chunk.text) {
          fullText += chunk.text
          updateLastMessage(fullText)
        }
        if (chunk.error) {
          updateLastMessage('❌ **Error de la API Claude:**\n\n' + chunk.error + '\n\n> Si el error menciona créditos, recarga en **platform.anthropic.com/settings/billing**')
          break
        }
        if (chunk.done && !fullText) {
          updateLastMessage('❌ **Sin respuesta** — verifica que tu API key tenga créditos en platform.anthropic.com/settings/billing')
        }
      }
    } catch {
      updateLastMessage('❌ **No se pudo conectar con el backend.**\n\nVerifica que esté corriendo:\n```\npython backend_main.py\n```')
    }

    setStreaming(false)
  }, [sessionId, isStreaming, activeDbSessionId])

  // Guardar sesión en proyecto
  async function handleSaveSession(projectId: string, title: string) {
    if (!sessionId) return
    try {
      const dbSession = await db.createSession(projectId, title, sessionId)
      setActiveDbSessionId(dbSession.id)
      // Guardar archivos y análisis
      await db.updateSession(dbSession.id, {
        files: files.map(f => ({ name: f.name, size: f.size })),
        analysis: analysis || undefined,
      })
      setShowSaveModal(false)
    } catch (e) {
      console.error('Error guardando sesión:', e)
    }
  }

  // Cargar sesión desde Supabase
  async function handleSelectSession(dbSessionId: string) {
    try {
      const session = await db.getSession(dbSessionId)
      setActiveDbSessionId(dbSessionId)
      clearMessages()
      clearFiles()
      autoAnalyzed.current = true // No re-analizar
      setAnalysisReady(false)

      // Cargar mensajes
      const msgs = await db.getMessages(dbSessionId)
      setMessages(msgs)

      // Restaurar análisis si existe
      if (session.analysis) {
        setAnalysis(session.analysis)
        setAnalysisReady(true)
      }
    } catch (e) {
      console.error('Error cargando sesión:', e)
    }
  }

  // Nueva sesión
  function handleNewSession() {
    clearMessages()
    clearFiles()
    setActiveDbSessionId(null)
    setAnalysis(null as any)
    setAnalysisReady(false)
    autoAnalyzed.current = false
  }

  async function handleFiles(incoming: File[]) {
    if (!sessionId) {
      alert('El backend no está disponible. Verifica que backend_main.py esté corriendo.')
      return
    }
    for (const f of incoming) addFile({ name: f.name, size: f.size, status: 'uploading' })
    try {
      await uploadFiles(sessionId, incoming)
      incoming.forEach(f => updateFileStatus(f.name, 'ready'))
      startPolling(sessionId)
    } catch (e) {
      incoming.forEach(f => updateFileStatus(f.name, 'error'))
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0d0e11] text-white overflow-hidden">
      <Header backendOk={backendOk} />
      <div className="flex flex-1 overflow-hidden">
        {/* Panel de proyectos */}
        <ProjectsPanel
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
        />
        {/* Sidebar de datos */}
        <Sidebar onFiles={handleFiles} />
        {/* Chat */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow onSuggestion={handleSend} />
          <ChatInput
            onSend={handleSend}
            onAttach={() => fileRef.current?.click()}
          />
        </section>
      </div>

      {/* Modal guardar sesión */}
      {showSaveModal && (
        <SaveSessionModal
          files={pendingFiles}
          onSave={handleSaveSession}
          onSkip={() => setShowSaveModal(false)}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv,.json"
        className="hidden"
        onChange={e => {
          if (e.target.files?.length) handleFiles(Array.from(e.target.files))
          e.target.value = ''
        }}
      />
    </div>
  )
}
