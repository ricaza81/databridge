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
    <div
      className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scroll-smooth"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Empty state */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-16">
          <div className="text-5xl" style={{ opacity: 0.25 }}>⚡</div>
          <div>
            <p className="text-[16px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Integración de datos con IA
            </p>
            <p className="text-[13px] max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
                  className="text-[12px] px-3.5 py-1.5 rounded-full transition-all hover:border-emerald-500/50 hover:text-emerald-600 hover:bg-emerald-50"
                  style={{
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface)',
                  }}
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
          <span className="text-[10px] px-1 font-medium tracking-wide uppercase" style={{ color: 'var(--text-faint)' }}>
            {msg.role === 'user' ? 'Tú' : '⚡ DataBridge'}
          </span>

          {msg.role === 'user' ? (
            <div
              className="max-w-[70%] rounded-2xl rounded-br-sm px-4 py-3 text-[14px] leading-relaxed"
              style={{ background: 'var(--bg-user-bubble)', color: '#ffffff' }}
            >
              <p>{msg.content}</p>
            </div>
          ) : (
            <div
              className="ai-response max-w-[85%] rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm"
              style={{
                background: 'var(--bg-ai-bubble)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) {
                    const isInline = !className
                    return isInline
                      ? <code className="rounded px-1.5 py-0.5 text-emerald-700 text-[12px] font-mono" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }} {...props}>{children}</code>
                      : <code className="text-[12px] font-mono" style={{ color: 'var(--text-primary)' }} {...props}>{children}</code>
                  },
                  pre({ children }) {
                    return <pre className="rounded-lg p-3 overflow-x-auto my-2 text-[12px]" style={{ background: '#f8f7f4', border: '1px solid var(--border)' }}>{children}</pre>
                  },
                  table({ children }) {
                    return <div className="overflow-x-auto my-2"><table className="w-full text-[13px] border-collapse">{children}</table></div>
                  },
                  th({ children }) {
                    return <th className="px-3 py-1.5 text-left text-[11px] uppercase tracking-wide font-semibold" style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{children}</th>
                  },
                  td({ children }) {
                    return <td className="px-3 py-1.5" style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>{children}</td>
                  },
                  h2({ children }) {
                    return <h2 className="text-[17px] font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{children}</h2>
                  },
                  h3({ children }) {
                    return <h3 className="text-[15px] font-semibold mt-3 mb-1 text-emerald-700">{children}</h3>
                  },
                  strong({ children }) {
                    return <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</strong>
                  },
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-emerald-500 pl-3 my-2 rounded-r py-1" style={{ color: 'var(--text-secondary)', background: '#f0fdf8' }}>{children}</blockquote>
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
                  },
                  p({ children }) {
                    return <p className="my-1.5">{children}</p>
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ))}

      {/* Typing indicator */}
      {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-[10px] px-1 font-medium tracking-wide uppercase" style={{ color: 'var(--text-faint)' }}>⚡ DataBridge</span>
          <div
            className="flex gap-1.5 items-center rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"
            style={{ background: 'var(--bg-ai-bubble)', border: '1px solid var(--border)' }}
          >
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: 'var(--text-faint)', animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
