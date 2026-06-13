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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="liquid-crystal-theme">{children}</body>
    </html>
  )
}
