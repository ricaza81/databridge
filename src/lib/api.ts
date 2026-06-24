const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

// ─── Session ──────────────────────────────────────────────────────────────────

export async function createSession(): Promise<{ session_id: string }> {
  const res = await fetch(`${API}/session`, { method: 'POST' })
  if (!res.ok) throw new Error('No se pudo crear la sesión')
  return res.json()
}

export async function getSession(sessionId: string) {
  const res = await fetch(`${API}/session/${sessionId}`)
  if (!res.ok) throw new Error('Sesión no encontrada')
  return res.json()
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadFiles(sessionId: string, files: File[]) {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await fetch(`${API}/upload/${sessionId}`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Error al subir archivos')
  return res.json()
}

// ─── Chat streaming ───────────────────────────────────────────────────────────

export async function* streamChat(
  sessionId: string,
  message: string
): AsyncGenerator<{ text?: string; done?: boolean; error?: string }> {
  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      try {
        yield JSON.parse(line.slice(6))
      } catch {}
    }
  }
}
