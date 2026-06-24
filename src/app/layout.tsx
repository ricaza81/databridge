import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DataBridge · Integración de datos con IA',
  description: 'Agente de integración de múltiples fuentes de datos con ML',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
