'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardNavProps {
  user: User
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'ダッシュボード' },
    { href: '/dashboard/rules', label: '占いルール' },
    { href: '/dashboard/images', label: '画像管理' },
    { href: '/dashboard/fortune-types', label: '占いタイプ' },
    { href: '/dashboard/message-templates', label: 'メッセージテンプレート' },
    { href: '/dashboard/chat', label: 'チャット' },
    { href: '/dashboard/auto-replies', label: '自動返信' },
    { href: '/dashboard/imagemaps', label: 'イメージマップ' },
    { href: '/dashboard/logs', label: 'ログ' },
    { href: '/dashboard/settings', label: '設定' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              占いルール管理
            </Link>
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

