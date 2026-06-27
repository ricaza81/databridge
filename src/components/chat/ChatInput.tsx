'use client'

import { useRef, useState, KeyboardEvent } from 'react'
import { ArrowUp, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

interface ChatInputProps {
  onSend: (text: string) => void
  onAttach: () => void
}

export function ChatInput({ onSend, onAttach }: ChatInputProps) {
  const [value, setValue] = useState('')
  const { isStreaming } = useStore()
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = Math.min(ref.current.scrollHeight, 140) + 'px'
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const txt = value.trim()
    if (!txt || isStreaming) return
    onSend(txt)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const canSend = !!value.trim() && !isStreaming

  return (
    <div
      className="px-6 pb-5 pt-3 flex-shrink-0"
      style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}
    >
      <div
        className={cn(
          'flex items-end gap-2 rounded-xl px-3 py-2.5 transition-colors duration-200 shadow-sm',
          'focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-500/40'
        )}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={onAttach}
          className="p-1.5 rounded-lg transition-all flex-shrink-0 hover:bg-[var(--bg-surface-alt)]"
          style={{ color: 'var(--text-muted)' }}
          title="Adjuntar archivo"
        >
          <Paperclip size={16} />
        </button>

        <textarea
          ref={ref}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder="Describe qué quieres analizar o sube un archivo para comenzar..."
          className="flex-1 bg-transparent border-none outline-none text-[14px] resize-none leading-relaxed min-h-[22px] max-h-[140px] font-sans py-0.5"
          style={{ color: 'var(--text-primary)' }}
          rows={1}
        />

        <button
          onClick={submit}
          disabled={!canSend}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
            canSend
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 cursor-pointer'
              : 'cursor-not-allowed'
          )}
          style={!canSend ? { background: 'var(--bg-surface-alt)', color: 'var(--text-faint)' } : {}}
        >
          <ArrowUp size={16} />
        </button>
      </div>
      <p className="text-[11px] text-center mt-2" style={{ color: 'var(--text-faint)' }}>
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  )
}
