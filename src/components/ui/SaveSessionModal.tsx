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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#16181d] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-white">Guardar sesión</h2>
            <p className="text-[12px] text-white/40 mt-0.5">
              {files.length} archivo{files.length > 1 ? 's' : ''} analizados
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nombre sesión */}
        <div className="mb-4">
          <label className="text-[11px] font-medium text-white/40 uppercase tracking-wide block mb-1.5">
            Nombre de la sesión
          </label>
          <input
            value={sessionTitle}
            onChange={e => setSessionTitle(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2
              text-[13px] text-white/80 outline-none focus:border-emerald-500/40 transition-colors"
          />
        </div>

        {/* Selección de proyecto */}
        <div className="mb-5">
          <label className="text-[11px] font-medium text-white/40 uppercase tracking-wide block mb-1.5">
            Proyecto
          </label>
          {projects.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-3 text-center">
              <FolderPlus size={16} className="mx-auto mb-1 text-white/20" />
              <p className="text-[12px] text-white/30">No tienes proyectos aún.</p>
              <p className="text-[11px] text-white/20">Crea uno desde el panel izquierdo primero.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all',
                    selectedProject === p.id
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
                  )}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-[13px] text-white/80">{p.name}</span>
                  {p.sessions && (
                    <span className="ml-auto text-[10px] text-white/30">
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
            className="flex-1 py-2 rounded-lg text-[13px] text-white/40 border border-white/10
              hover:bg-white/5 transition-all"
          >
            Sin guardar
          </button>
          <button
            onClick={() => onSave(selectedProject, sessionTitle)}
            disabled={!selectedProject || !sessionTitle.trim() || projects.length === 0}
            className={cn(
              'flex-1 py-2 rounded-lg text-[13px] font-medium transition-all',
              selectedProject && sessionTitle.trim() && projects.length > 0
                ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                : 'bg-white/10 text-white/20 cursor-not-allowed'
            )}
          >
            Guardar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
