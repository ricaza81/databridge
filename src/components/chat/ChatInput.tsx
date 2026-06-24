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
    <div className="px-6 pb-5 pt-3 border-t border-white/[0.07] bg-[#13151a] flex-shrink-0">
      <div className={cn(
        'flex items-end gap-2 bg-white/[0.04] border rounded-xl px-3 py-2.5 transition-colors duration-200',
        'border-white/[0.08]',
        'focus-within:border-emerald-500/40'
      )}>
        <button
          onClick={onAttach}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all flex-shrink-0"
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
          className="flex-1 bg-transparent border-none outline-none text-[14px] text-white/85
            placeholder:text-white/25 resize-none leading-relaxed min-h-[22px] max-h-[140px]
            font-sans py-0.5"
          rows={1}
        />

        <button
          onClick={submit}
          disabled={!canSend}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
            canSend
              ? 'bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 cursor-pointer'
              : 'bg-white/[0.08] text-white/20 cursor-not-allowed'
          )}
        >
          <ArrowUp size={16} />
        </button>
      </div>
      <p className="text-[11px] text-white/20 text-center mt-2">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  )
}
