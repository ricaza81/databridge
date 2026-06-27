'use client'

import { useEffect, useState } from 'react'
import { Plus, FolderOpen, MessageSquare, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useStore, Project } from '@/store'
import { usePersistence } from '@/hooks/usePersistence'
import { cn } from '@/lib/utils'

interface ProjectsPanelProps {
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
}

export function ProjectsPanel({ onSelectSession, onNewSession }: ProjectsPanelProps) {
  const { projects, setProjects, addProject, removeProject, activeProjectId, setActiveProjectId, activeDbSessionId } = useStore()
  const db = usePersistence()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.getProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!newName.trim()) return
    try {
      const p = await db.createProject(newName.trim())
      addProject(p)
      setNewName('')
      setCreating(false)
      setActiveProjectId(p.id)
      setExpanded(prev => new Set([...prev, p.id]))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('¿Eliminar este proyecto y todas sus sesiones?')) return
    await db.deleteProject(id)
    removeProject(id)
    if (activeProjectId === id) setActiveProjectId(null)
  }

  return (
    <div
      className="w-[220px] flex-shrink-0 flex flex-col"
      style={{ background: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          Proyectos
        </span>
        <button
          onClick={() => setCreating(true)}
          className="w-6 h-6 rounded flex items-center justify-center transition-all hover:bg-[var(--bg-surface-alt)] hover:text-emerald-600"
          style={{ color: 'var(--text-muted)' }}
          title="Nuevo proyecto"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Nuevo proyecto input */}
      {creating && (
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setCreating(false); setNewName('') }
            }}
            placeholder="Nombre del proyecto..."
            className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-emerald-500/40 transition-colors"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={handleCreate}
              className="flex-1 text-[11px] py-1 rounded text-emerald-700 hover:bg-emerald-100 transition-all"
              style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}
            >
              Crear
            </button>
            <button
              onClick={() => { setCreating(false); setNewName('') }}
              className="flex-1 text-[11px] py-1 rounded transition-all hover:bg-[var(--bg-surface)]"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista proyectos */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <p className="text-[11px] px-4 py-3" style={{ color: 'var(--text-faint)' }}>Cargando...</p>
        )}
        {!loading && projects.length === 0 && (
          <div className="px-4 py-6 text-center">
            <FolderOpen size={20} className="mx-auto mb-2" style={{ color: 'var(--text-faint)' }} />
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Sin proyectos aún</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Haz clic en + para crear uno</p>
          </div>
        )}

        {projects.map(project => (
          <div key={project.id}>
            {/* Proyecto row */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer group transition-colors"
              style={{
                background: activeProjectId === project.id ? 'var(--bg-surface-alt)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (activeProjectId !== project.id)
                  (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.025)'
              }}
              onMouseLeave={e => {
                if (activeProjectId !== project.id)
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
              onClick={() => {
                setActiveProjectId(project.id)
                toggleExpand(project.id)
              }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: project.color }} />
              <span className="flex-1 text-[12px] truncate font-medium" style={{ color: 'var(--text-secondary)' }}>
                {project.name}
              </span>
              <button
                onClick={e => handleDelete(project.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-all hover:text-red-500"
                style={{ color: 'var(--text-faint)' }}
              >
                <Trash2 size={11} />
              </button>
              {expanded.has(project.id)
                ? <ChevronDown size={11} className="flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                : <ChevronRight size={11} className="flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
              }
            </div>

            {/* Sesiones del proyecto */}
            {expanded.has(project.id) && (
              <SessionList
                projectId={project.id}
                activeSessionId={activeDbSessionId}
                onSelect={onSelectSession}
                onNew={() => {
                  setActiveProjectId(project.id)
                  onNewSession()
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sub-componente: lista de sesiones de un proyecto ────────────────────────

function SessionList({
  projectId,
  activeSessionId,
  onSelect,
  onNew,
}: {
  projectId: string
  activeSessionId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const [sessions, setSessions] = useState<any[]>([])
  const db = usePersistence()

  useEffect(() => {
    db.getProjectSessions(projectId)
      .then(setSessions)
      .catch(console.error)
  }, [projectId])

  return (
    <div className="ml-4 pl-2 mb-1" style={{ borderLeft: '1px solid var(--border)' }}>
      {sessions.map(s => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors text-[11px]"
          style={
            activeSessionId === s.id
              ? { background: '#ecfdf5', color: '#059669' }
              : { color: 'var(--text-muted)' }
          }
          onMouseEnter={e => {
            if (activeSessionId !== s.id)
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={e => {
            if (activeSessionId !== s.id)
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
          }}
        >
          <MessageSquare size={10} className="flex-shrink-0" />
          <span className="truncate">{s.title}</span>
        </div>
      ))}
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] transition-colors w-full hover:text-emerald-600"
        style={{ color: 'var(--text-faint)' }}
      >
        <Plus size={10} />
        Nueva sesión
      </button>
    </div>
  )
}
