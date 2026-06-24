'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  '¿Qué relaciones encontraste entre los archivos?',
  '¿Cuáles son los principales problemas de calidad?',
  'Propón el modelo de integración unificado',
  'Genera el pipeline ETL en Python',
]

interface ChatWindowProps {
  onSuggestion: (text: string) => void
}

export function ChatWindow({ onSuggestion }: ChatWindowProps) {
  const { messages, isStreaming, analysisReady } = useStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isEmpty = messages.length === 0

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scroll-smooth">

      {/* Empty state */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-16">
          <div className="text-5xl opacity-30">⚡</div>
          <div>
            <p className="text-[16px] font-semibold text-white/60 mb-1">
              Integración de datos con IA
            </p>
            <p className="text-[13px] text-white/30 max-w-sm leading-relaxed">
              Sube archivos Excel, CSV o conecta una base de datos.
              El agente detecta relaciones, llaves y problemas de calidad automáticamente.
            </p>
          </div>
          {analysisReady && (
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  className="text-[12px] px-3.5 py-1.5 rounded-full border border-white/10 text-white/40
                    hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn('flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}
        >
          <span className="text-[10px] text-white/25 px-1">
            {msg.role === 'user' ? 'Tú' : '⚡ DataBridge'}
          </span>

          <div className={cn(
            'max-w-[820px] rounded-xl px-4 py-3 text-[14px] leading-relaxed',
            msg.role === 'user'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-white/90 rounded-br-sm'
              : 'bg-white/[0.04] border border-white/[0.07] text-white/85 rounded-bl-sm'
          )}>
            {msg.role === 'user' ? (
              <p>{msg.content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) {
                    const isInline = !className
                    return isInline
                      ? <code className="bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-emerald-300 text-[12px] font-mono" {...props}>{children}</code>
                      : <code className="text-[12px] font-mono text-slate-200" {...props}>{children}</code>
                  },
                  pre({ children }) {
                    return <pre className="bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto my-2 text-[12px]">{children}</pre>
                  },
                  table({ children }) {
                    return <div className="overflow-x-auto my-2"><table className="w-full text-[12px] border-collapse">{children}</table></div>
                  },
                  th({ children }) {
                    return <th className="bg-white/5 border border-white/10 px-3 py-1.5 text-left text-white/50 font-semibold text-[11px] uppercase tracking-wide">{children}</th>
                  },
                  td({ children }) {
                    return <td className="border border-white/[0.07] px-3 py-1.5 text-white/75">{children}</td>
                  },
                  h2({ children }) {
                    return <h2 className="text-[15px] font-semibold text-white/90 mt-4 mb-2">{children}</h2>
                  },
                  h3({ children }) {
                    return <h3 className="text-[14px] font-semibold text-emerald-400 mt-3 mb-1">{children}</h3>
                  },
                  strong({ children }) {
                    return <strong className="text-white font-semibold">{children}</strong>
                  },
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-emerald-500 pl-3 my-2 text-white/50 bg-emerald-500/5 rounded-r py-1">{children}</blockquote>
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-[10px] text-white/25 px-1">⚡ DataBridge</span>
          <div className="flex gap-1.5 items-center bg-white/[0.04] border border-white/[0.07] rounded-xl rounded-bl-sm px-4 py-3">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
