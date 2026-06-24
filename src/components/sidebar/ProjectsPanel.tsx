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
    <div className="w-[220px] flex-shrink-0 border-r border-white/[0.07] bg-[#0f1014] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
          Proyectos
        </span>
        <button
          onClick={() => setCreating(true)}
          className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-emerald-400 hover:bg-white/5 transition-all"
          title="Nuevo proyecto"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Nueva proyecto input */}
      {creating && (
        <div className="px-3 py-2 border-b border-white/[0.07]">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setCreating(false); setNewName('') }
            }}
            placeholder="Nombre del proyecto..."
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1.5
              text-[12px] text-white/80 placeholder:text-white/25 outline-none
              focus:border-emerald-500/40"
          />
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={handleCreate}
              className="flex-1 text-[11px] py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
            >
              Crear
            </button>
            <button
              onClick={() => { setCreating(false); setNewName('') }}
              className="flex-1 text-[11px] py-1 rounded bg-white/5 text-white/30 hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista proyectos */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <p className="text-[11px] text-white/25 px-4 py-3">Cargando...</p>
        )}
        {!loading && projects.length === 0 && (
          <div className="px-4 py-6 text-center">
            <FolderOpen size={20} className="mx-auto mb-2 text-white/15" />
            <p className="text-[11px] text-white/25">Sin proyectos aún</p>
            <p className="text-[10px] text-white/15 mt-1">Haz clic en + para crear uno</p>
          </div>
        )}

        {projects.map(project => (
          <div key={project.id}>
            {/* Proyecto row */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 cursor-pointer group transition-colors',
                activeProjectId === project.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
              )}
              onClick={() => {
                setActiveProjectId(project.id)
                toggleExpand(project.id)
              }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: project.color }} />
              <span className="flex-1 text-[12px] text-white/70 truncate font-medium">
                {project.name}
              </span>
              <button
                onClick={e => handleDelete(project.id, e)}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
              >
                <Trash2 size={11} />
              </button>
              {expanded.has(project.id)
                ? <ChevronDown size={11} className="text-white/20 flex-shrink-0" />
                : <ChevronRight size={11} className="text-white/20 flex-shrink-0" />
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
    <div className="ml-4 border-l border-white/[0.06] pl-2 mb-1">
      {sessions.map(s => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors text-[11px]',
            activeSessionId === s.id
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
          )}
        >
          <MessageSquare size={10} className="flex-shrink-0" />
          <span className="truncate">{s.title}</span>
        </div>
      ))}
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-white/20
          hover:text-emerald-400 transition-colors w-full"
      >
        <Plus size={10} />
        Nueva sesión
      </button>
    </div>
  )
}
