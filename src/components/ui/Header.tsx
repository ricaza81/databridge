'use client'

import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface HeaderProps {
  backendOk: boolean | null
}

export function Header({ backendOk }: HeaderProps) {
  const { analysisReady, files } = useStore()

  const statusColor = backendOk === null
    ? 'bg-white/20'
    : backendOk
    ? analysisReady
      ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
      : files.length > 0
      ? 'bg-amber-400 animate-pulse'
      : 'bg-emerald-400'
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
    <header className="h-[52px] flex items-center gap-3 px-5 border-b border-white/[0.07] bg-[#13151a] flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[14px]">
          ⚡
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Data<span className="text-emerald-400">Bridge</span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {files.length > 0 && backendOk && (
          <span className="text-[11px] text-white/30">
            {files.length} archivo{files.length > 1 ? 's' : ''}
          </span>
        )}
        <div className={cn('w-2 h-2 rounded-full transition-all', statusColor)} />
        <span className={cn(
          'text-[12px]',
          backendOk === false ? 'text-red-400' : 'text-white/40'
        )}>
          {statusLabel}
        </span>
      </div>
    </header>
  )
}
