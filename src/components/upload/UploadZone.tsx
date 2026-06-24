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
        'border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5',
        isDragActive && 'border-emerald-400 bg-emerald-500/10 scale-[1.02]',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      <Upload
        size={22}
        className={cn('mx-auto mb-2 opacity-50', isDragActive && 'text-emerald-400 opacity-100')}
      />
      <p className="text-[13px] font-medium text-white/80 mb-1">
        {isDragActive ? 'Suelta los archivos aquí' : 'Sube tus fuentes de datos'}
      </p>
      <p className="text-[11px] text-white/30">Excel · CSV · JSON</p>

      <div className="flex justify-center gap-3 mt-3 opacity-40">
        <FileSpreadsheet size={14} />
        <FileText size={14} />
      </div>
    </div>
  )
}
