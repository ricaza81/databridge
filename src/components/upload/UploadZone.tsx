'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

const ACCEPTED = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/json': ['.json'],
}

export function UploadZone({ onFiles, disabled }: UploadZoneProps) {
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length) onFiles(accepted)
  }, [onFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    disabled,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200',
        isDragActive && 'scale-[1.02]',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
      style={{
        borderColor: isDragActive ? '#10b981' : 'var(--border)',
        background: isDragActive ? '#f0fdf8' : 'var(--bg-surface)',
      }}
      onMouseEnter={e => {
        if (!isDragActive && !disabled)
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.4)'
      }}
      onMouseLeave={e => {
        if (!isDragActive)
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
      }}
    >
      <input {...getInputProps()} />
      <Upload
        size={22}
        className="mx-auto mb-2 transition-colors"
        style={{ color: isDragActive ? '#10b981' : 'var(--text-muted)', opacity: isDragActive ? 1 : 0.6 }}
      />
      <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        {isDragActive ? 'Suelta los archivos aquí' : 'Sube tus fuentes de datos'}
      </p>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Excel · CSV · JSON</p>

      <div className="flex justify-center gap-3 mt-3" style={{ color: 'var(--text-faint)' }}>
        <FileSpreadsheet size={14} />
        <FileText size={14} />
      </div>
    </div>
  )
}
