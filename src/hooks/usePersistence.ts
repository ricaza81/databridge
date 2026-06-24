'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { ChatMessage } from '@/types'

export function usePersistence() {
  const db = createClient()

  // ── Proyectos ────────────────────────────────────────────────────────────

  async function getProjects() {
    const { data, error } = await db
      .from('projects')
      .select('*, sessions(id, title, updated_at)')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  }

  async function createProject(name: string, description?: string) {
    const { data, error } = await db
      .from('projects')
      .insert({ name, description })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function updateProject(id: string, fields: { name?: string; description?: string }) {
    const { error } = await db.from('projects').update(fields).eq('id', id)
    if (error) throw error
  }

  async function deleteProject(id: string) {
    const { error } = await db.from('projects').delete().eq('id', id)
    if (error) throw error
  }

  // ── Sesiones ─────────────────────────────────────────────────────────────

  async function createSession(projectId: string, title: string, backendSid: string) {
    const { data, error } = await db
      .from('sessions')
      .insert({ project_id: projectId, title, backend_sid: backendSid })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function updateSession(id: string, fields: {
    title?: string
    files?: object[]
    analysis?: object
  }) {
    const { error } = await db.from('sessions').update(fields).eq('id', id)
    if (error) throw error
  }

  async function getSession(id: string) {
    const { data, error } = await db
      .from('sessions')
      .select('*, messages(*)') 
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  async function getProjectSessions(projectId: string) {
    const { data, error } = await db
      .from('sessions')
      .select('id, title, files, created_at, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  }

  async function deleteSession(id: string) {
    const { error } = await db.from('sessions').delete().eq('id', id)
    if (error) throw error
  }

  // ── Mensajes ─────────────────────────────────────────────────────────────

  async function saveMessage(sessionId: string, msg: ChatMessage) {
    const { error } = await db.from('messages').insert({
      id: msg.id,
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
    })
    if (error) throw error
  }

  async function getMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await db
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at),
    }))
  }

  async function updateMessageContent(id: string, content: string) {
    const { error } = await db.from('messages').update({ content }).eq('id', id)
    if (error) throw error
  }

  return {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    createSession,
    updateSession,
    getSession,
    getProjectSessions,
    deleteSession,
    saveMessage,
    getMessages,
    updateMessageContent,
  }
}
