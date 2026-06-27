import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { Analysis, ChatMessage, UploadedFile } from '@/types'

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
  updated_at: string
  sessions?: SessionMeta[]
}

export interface SessionMeta {
  id: string
  title: string
  updated_at: string
}

interface DataBridgeStore {
  // Sesión backend
  sessionId: string | null
  setSessionId: (id: string) => void

  // Proyecto activo
  activeProjectId: string | null
  setActiveProjectId: (id: string | null) => void

  // Sesión DB activa (Supabase)
  activeDbSessionId: string | null
  setActiveDbSessionId: (id: string | null) => void

  // Lista de proyectos
  projects: Project[]
  setProjects: (p: Project[]) => void
  addProject: (p: Project) => void
  removeProject: (id: string) => void

  // Archivos
  files: UploadedFile[]
  addFile: (file: UploadedFile) => void
  updateFileStatus: (name: string, status: UploadedFile['status']) => void
  clearFiles: () => void

  // Análisis
  analysis: Analysis | null
  analysisReady: boolean
  setAnalysis: (a: Analysis) => void
  setAnalysisReady: (v: boolean) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  updateLastMessage: (content: string) => void
  setMessages: (msgs: ChatMessage[]) => void
  clearMessages: () => void

  // Auth
  user: User | null
  setUser: (user: User | null) => void

  // UI
  isStreaming: boolean
  setStreaming: (v: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

export const useStore = create<DataBridgeStore>((set) => ({
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  activeDbSessionId: null,
  setActiveDbSessionId: (id) => set({ activeDbSessionId: id }),

  projects: [],
  setProjects: (p) => set({ projects: p }),
  addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
  removeProject: (id) => set((s) => ({ projects: s.projects.filter(p => p.id !== id) })),

  files: [],
  addFile: (file) => set((s) => ({ files: [...s.files, file] })),
  updateFileStatus: (name, status) =>
    set((s) => ({ files: s.files.map((f) => f.name === name ? { ...f, status } : f) })),
  clearFiles: () => set({ files: [] }),

  analysis: null,
  analysisReady: false,
  setAnalysis: (a) => set({ analysis: a }),
  setAnalysisReady: (v) => set({ analysisReady: v }),

  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (content) =>
    set((s) => {
      const msgs = s.messages.map((m, i) =>
        i === s.messages.length - 1 && m.role === 'assistant' ? { ...m, content } : m
      )
      return { messages: msgs }
    }),
  setMessages: (msgs) => set({ messages: msgs }),
  clearMessages: () => set({ messages: [] }),

  user: null,
  setUser: (user) => set({ user }),

  isStreaming: false,
  setStreaming: (v) => set({ isStreaming: v }),
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}))
