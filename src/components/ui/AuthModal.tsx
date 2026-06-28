'use client'

import { useState } from 'react'
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfoMsg('')
    setLoading(true)
    const supabase = createClient()

    try {
      if (tab === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          onSuccess()
        } else {
          setInfoMsg('Revisa tu email para confirmar tu cuenta y luego inicia sesión.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onSuccess()
      }
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Ingresa tu email primero.')
      return
    }
    setError('')
    setInfoMsg('')
    setResettingPassword(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/dashboard',
      })
      if (error) throw error
      setInfoMsg('Te enviamos un enlace para restablecer tu contraseña.')
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Error al enviar el email')
    } finally {
      setResettingPassword(false)
    }
  }

  async function handleGoogle() {
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
    if (error) setError(error.message)
  }

  function switchTab(t: 'signup' | 'login') {
    setTab(t)
    setError('')
    setInfoMsg('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-[390px] mx-4 rounded-2xl shadow-2xl p-7"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface-alt)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[18px] mx-auto mb-3">
            ⚡
          </div>
          <h2
            className="text-[17px] font-semibold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}
          >
            {tab === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Para guardar tus archivos y proyectos<br />necesitas una cuenta gratuita.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-5" style={{ background: 'var(--bg-surface-alt)' }}>
          {(['signup', 'login'] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={cn(
                'flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all',
                tab === t ? 'shadow-sm' : ''
              )}
              style={
                tab === t
                  ? { background: 'var(--bg-surface)', color: 'var(--text-primary)' }
                  : { color: 'var(--text-muted)' }
              }
            >
              {t === 'signup' ? 'Registro' : 'Iniciar sesión'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Email */}
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[13px] outline-none"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Contraseña con toggle */}
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña (mín. 6 caracteres)"
              required
              minLength={6}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl text-[13px] outline-none"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors hover:bg-[var(--bg-surface-alt)]"
              style={{ color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Link olvidé contraseña — solo en login */}
          {tab === 'login' && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resettingPassword}
                className="text-[11px] transition-colors hover:text-emerald-600 disabled:opacity-50"
                style={{ color: 'var(--text-muted)' }}
              >
                {resettingPassword ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
              </button>
            </div>
          )}

          {error && (
            <p className="text-[12px] px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200">
              {error}
            </p>
          )}
          {infoMsg && (
            <p className="text-[12px] px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              {infoMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-[13px] font-medium text-white transition-colors mt-1 disabled:opacity-60"
            style={{ background: '#10b981' }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#059669' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#10b981' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                {tab === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
              </span>
            ) : (
              tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>o continúa con</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-alt)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        {/* Pie de términos */}
        <p className="text-center text-[10px] mt-4 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
          Al continuar aceptas los{' '}
          <span className="underline cursor-pointer hover:text-emerald-600 transition-colors">Términos de uso</span>
          {' '}y la{' '}
          <span className="underline cursor-pointer hover:text-emerald-600 transition-colors">Política de privacidad</span>.
        </p>
      </div>
    </div>
  )
}
