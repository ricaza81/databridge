'use client'

import { useStore } from '@/store'
import { cn } from '@/lib/utils'

export function Header() {
  const { analysisReady, files } = useStore()

  return (
    <header className="h-[52px] flex items-center gap-3 px-5 border-b border-white/[0.07] bg-[#13151a] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[14px]">
          ⚡
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Data<span className="text-emerald-400">Bridge</span>
        </span>
      </div>

      {/* Status */}
      <div className="ml-auto flex items-center gap-2">
        {files.length > 0 && (
          <span className="text-[11px] text-white/30">
            {files.length} archivo{files.length > 1 ? 's' : ''}
          </span>
        )}
        <div className={cn(
          'w-2 h-2 rounded-full transition-all',
          analysisReady
            ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
            : files.length > 0
            ? 'bg-amber-400 animate-pulse'
            : 'bg-white/20'
        )} />
        <span className="text-[12px] text-white/40">
          {analysisReady ? `${files.length} fuentes listas` : files.length > 0 ? 'Analizando...' : 'Listo'}
        </span>
      </div>
    </header>
  )
}
