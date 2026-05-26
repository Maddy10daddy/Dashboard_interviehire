import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IntervieHire Dashboard',
  description: 'AI-driven Real-time Hiring Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
