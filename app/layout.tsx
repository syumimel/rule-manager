import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '占いルール管理システム',
  description: 'LINE公式アカウント占い提供システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}



