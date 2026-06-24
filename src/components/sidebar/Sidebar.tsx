'use client'

import { FileSpreadsheet, Link2, AlertTriangle, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { UploadZone } from '@/components/upload/UploadZone'
import { cn, confidenceBorder, confidenceColor, severityColor, formatBytes } from '@/lib/utils'
import { uploadFiles } from '@/lib/api'
import { useSession } from '@/hooks/useSession'

export function Sidebar() {
  const { files, addFile, updateFileStatus, analysis, analysisReady } = useStore()
  const { sessionId, startPolling } = useSession()

  async function handleFiles(incoming: File[]) {
    if (!sessionId) return
    for (const f of incoming) {
      addFile({ name: f.name, size: f.size, status: 'uploading' })
    }
    try {
      await uploadFiles(sessionId, incoming)
      incoming.forEach((f) => updateFileStatus(f.name, 'ready'))
      startPolling(sessionId)
    } catch {
      incoming.forEach((f) => updateFileStatus(f.name, 'error'))
    }
  }

  const topRels = analysis?.relationships.slice(0, 6) ?? []
  const highIssues = analysis?.quality_issues.filter(i => i.severity === 'alta').slice(0, 4) ?? []

  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-white/[0.07] bg-[#13151a] flex flex-col overflow-y-auto">
      <div className="p-4 flex flex-col gap-5">

        {/* Upload */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">
            Fuentes de datos
          </p>
          <UploadZone onFiles={handleFiles} />
        </div>

        {/* Files list */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Archivos ({files.length})
            </p>
            {files.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2"
              >
                <FileSpreadsheet size={14} className="text-white/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/80 truncate">{f.name}</p>
                  <p className="text-[10px] text-white/30">{formatBytes(f.size)}</p>
                </div>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                  f.status === 'ready' ? 'bg-emerald-500/15 text-emerald-400' :
                  f.status === 'error' ? 'bg-red-500/15 text-red-400' :
                  'bg-amber-500/15 text-amber-400'
                )}>
                  {f.status === 'ready' ? 'Listo' : f.status === 'error' ? 'Error' : '...'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sources summary */}
        {analysisReady && analysis && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Fuentes analizadas
            </p>
            {analysis.sources.map((src) => (
              <div key={src.name} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                <p className="text-[12px] font-medium text-white/80 truncate mb-1.5">{src.name}</p>
                <div className="flex justify-between text-[11px] text-white/40 py-0.5">
                  <span>Filas</span><span className="text-white/70 font-medium">{src.rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-white/40 py-0.5">
                  <span>Columnas</span><span className="text-white/70 font-medium">{src.cols}</span>
                </div>
                {src.potential_keys.length > 0 && (
                  <div className="flex justify-between text-[11px] text-white/40 py-0.5">
                    <span>Llaves pot.</span>
                    <span className="text-emerald-400 font-medium">{src.potential_keys.length}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Relationships */}
        {topRels.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 flex items-center gap-1">
              <Link2 size={10} /> Relaciones ({analysis!.relationships.length})
            </p>
            {topRels.map((rel, i) => (
              <div
                key={i}
                className={cn(
                  'border-l-2 pl-2.5 py-1.5 bg-white/[0.02] rounded-r-lg',
                  confidenceBorder(rel.confidence)
                )}
              >
                <p className="text-[11px] font-medium text-white/80 leading-tight">
                  {rel.col_a} ↔ {rel.col_b}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5 leading-tight truncate">
                  {rel.source_a.split('·')[0].trim()} · {rel.source_b.split('·')[0].trim()}
                </p>
                <p className={cn('text-[10px] mt-0.5 font-medium', confidenceColor(rel.confidence))}>
                  {rel.min_coverage_pct}% cobertura · {rel.confidence}% confianza
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Quality issues */}
        {highIssues.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 flex items-center gap-1">
              <AlertTriangle size={10} /> Alertas de calidad
            </p>
            {highIssues.map((issue, i) => (
              <div key={i} className="bg-red-500/[0.07] border border-red-500/20 rounded-lg px-3 py-2">
                <p className="text-[11px] font-medium text-red-400">{issue.column}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{issue.detail}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </aside>
  )
}
