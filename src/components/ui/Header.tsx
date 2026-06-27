'use client'

import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface HeaderProps {
  backendOk: boolean | null
}

export function Header({ backendOk }: HeaderProps) {
  const { analysisReady, files } = useStore()

  const statusColor = backendOk === null
    ? 'bg-[var(--text-faint)]'
    : backendOk
    ? analysisReady
      ? 'bg-emerald-500 shadow-[0_0_6px_#34d399]'
      : files.length > 0
      ? 'bg-amber-400 animate-pulse'
      : 'bg-emerald-500'
    : 'bg-red-400'

  const statusLabel = backendOk === null
    ? 'Conectando...'
    : !backendOk
    ? 'Backend no disponible — corre backend_main.py'
    : analysisReady
    ? `${files.length} fuentes listas`
    : files.length > 0
    ? 'Analizando...'
    : 'Listo'

  return (
    <header
      className="h-[52px] flex items-center gap-3 px-5 flex-shrink-0"
      style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[14px]">
          ⚡
        </div>
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Data<span className="text-emerald-600">Bridge</span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {files.length > 0 && backendOk && (
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {files.length} archivo{files.length > 1 ? 's' : ''}
          </span>
        )}
        <div className={cn('w-2 h-2 rounded-full transition-all', statusColor)} />
        <span className={cn(
          'text-[12px]',
          backendOk === false ? 'text-red-500' : ''
        )} style={backendOk !== false ? { color: 'var(--text-muted)' } : {}}>
          {statusLabel}
        </span>
      </div>
    </header>
  )
}
