'use client'

import { FileSpreadsheet, Link2, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store'
import { UploadZone } from '@/components/upload/UploadZone'
import { cn, confidenceBorder, confidenceColor, formatBytes } from '@/lib/utils'

interface SidebarProps {
  onFiles: (files: File[]) => void
}

export function Sidebar({ onFiles }: SidebarProps) {
  const { files, analysis, analysisReady } = useStore()

  const topRels = analysis?.relationships.slice(0, 6) ?? []
  const highIssues = analysis?.quality_issues.filter(i => i.severity === 'alta').slice(0, 4) ?? []

  return (
    <aside
      className="w-[260px] flex-shrink-0 flex flex-col overflow-y-auto"
      style={{ background: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}
    >
      <div className="p-4 flex flex-col gap-5">

        {/* Upload */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>
            Fuentes de datos
          </p>
          <UploadZone onFiles={onFiles} />
        </div>

        {/* Files list */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
              Archivos ({files.length})
            </p>
            {files.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <FileSpreadsheet size={14} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{formatBytes(f.size)}</p>
                </div>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                  f.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                  f.status === 'error' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-700 animate-pulse'
                )}>
                  {f.status === 'ready' ? 'Listo' : f.status === 'error' ? 'Error' : 'Subiendo...'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sources summary */}
        {analysisReady && analysis && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
              Fuentes analizadas
            </p>
            {analysis.sources.map((src) => (
              <div
                key={src.name}
                className="rounded-lg px-3 py-2.5"
                style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-[12px] font-medium truncate mb-1.5" style={{ color: 'var(--text-primary)' }}>{src.name}</p>
                <div className="flex justify-between text-[11px] py-0.5">
                  <span style={{ color: 'var(--text-muted)' }}>Filas</span>
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{src.rows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] py-0.5">
                  <span style={{ color: 'var(--text-muted)' }}>Columnas</span>
                  <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{src.cols}</span>
                </div>
                {src.potential_keys.length > 0 && (
                  <div className="flex justify-between text-[11px] py-0.5">
                    <span style={{ color: 'var(--text-muted)' }}>Llaves pot.</span>
                    <span className="text-emerald-600 font-medium">{src.potential_keys.length}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Relationships */}
        {topRels.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
              <Link2 size={10} /> Relaciones ({analysis!.relationships.length})
            </p>
            {topRels.map((rel, i) => (
              <div
                key={i}
                className={cn('border-l-2 pl-2.5 py-1.5 rounded-r-lg', confidenceBorder(rel.confidence))}
                style={{ background: 'var(--bg-surface-alt)' }}
              >
                <p className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {rel.col_a} ↔ {rel.col_b}
                </p>
                <p className="text-[10px] mt-0.5 leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
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
            <p className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
              <AlertTriangle size={10} /> Alertas de calidad
            </p>
            {highIssues.map((issue, i) => (
              <div key={i} className="rounded-lg px-3 py-2" style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
                <p className="text-[11px] font-medium text-red-600">{issue.column}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{issue.detail}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </aside>
  )
}
