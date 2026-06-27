'use client'

import { useState } from 'react'
import { X, FolderPlus } from 'lucide-react'
import { useStore, Project } from '@/store'
import { cn } from '@/lib/utils'

interface SaveSessionModalProps {
  onSave: (projectId: string, sessionTitle: string) => void
  onSkip: () => void
  onClose: () => void
  files: string[]
}

export function SaveSessionModal({ onSave, onSkip, onClose, files }: SaveSessionModalProps) {
  const { projects } = useStore()
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id || '')
  const [sessionTitle, setSessionTitle] = useState(
    `Análisis ${files.slice(0, 2).join(', ')}${files.length > 2 ? '...' : ''}`
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md p-6 rounded-2xl shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Guardar sesión</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {files.length} archivo{files.length > 1 ? 's' : ''} analizados
            </p>
          </div>
          <button
            onClick={onClose}
            className="transition-colors hover:text-[var(--text-secondary)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nombre sesión */}
        <div className="mb-4">
          <label className="text-[11px] font-medium uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Nombre de la sesión
          </label>
          <input
            value={sessionTitle}
            onChange={e => setSessionTitle(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none transition-colors focus:border-emerald-500/40"
            style={{
              background: 'var(--bg-surface-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Selección de proyecto */}
        <div className="mb-5">
          <label className="text-[11px] font-medium uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Proyecto
          </label>
          {projects.length === 0 ? (
            <div
              className="rounded-lg px-3 py-3 text-center"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)' }}
            >
              <FolderPlus size={16} className="mx-auto mb-1" style={{ color: 'var(--text-faint)' }} />
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No tienes proyectos aún.</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Crea uno desde el panel izquierdo primero.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                  style={
                    selectedProject === p.id
                      ? { border: '1px solid rgba(16,185,129,0.35)', background: '#f0fdf8' }
                      : { border: '1px solid var(--border)', background: 'var(--bg-surface-alt)' }
                  }
                  onMouseEnter={e => {
                    if (selectedProject !== p.id)
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'
                  }}
                  onMouseLeave={e => {
                    if (selectedProject !== p.id)
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)'
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  {p.sessions && (
                    <span className="ml-auto text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {(p.sessions as any[]).length} sesiones
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 py-2 rounded-lg text-[13px] transition-all"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            Sin guardar
          </button>
          <button
            onClick={() => onSave(selectedProject, sessionTitle)}
            disabled={!selectedProject || !sessionTitle.trim() || projects.length === 0}
            className={cn(
              'flex-1 py-2 rounded-lg text-[13px] font-medium transition-all',
              selectedProject && sessionTitle.trim() && projects.length > 0
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'cursor-not-allowed'
            )}
            style={
              !(selectedProject && sessionTitle.trim() && projects.length > 0)
                ? { background: 'var(--bg-surface-alt)', color: 'var(--text-faint)' }
                : {}
            }
          >
            Guardar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
