'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Supabaseクライアントの初期化（エラーハンドリング付き）
  let supabase: ReturnType<typeof createClient> | null = null
  try {
    supabase = createClient()
  } catch (err: any) {
    console.error('Supabaseクライアント初期化エラー:', err)
    // エラーは後で表示される
  }

  // URLパラメータからエラーを取得
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  // 既にログインしている場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (!supabase) {
      setError('Supabaseクライアントの初期化に失敗しました。環境変数を確認してください。')
      return
    }
    
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('セッション取得エラー:', error)
          return
        }
        if (session) {
          console.log('既にログイン済み。ダッシュボードにリダイレクトします。')
          router.replace('/dashboard')
        }
      } catch (err) {
        console.error('セッションチェックエラー:', err)
      }
    }
    checkSession()
  }, [router, supabase])

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Supabaseクライアントの初期化に失敗しました。環境変数を確認してください。')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Googleログイン開始...')
      console.log('リダイレクトURL:', `${window.location.origin}/auth/callback`)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      console.log('signInWithOAuth レスポンス:', { data, error })

      if (error) {
        console.error('Google認証エラー:', error)
        if (error.message.includes('provider is not enabled')) {
          setError('Google認証が有効になっていません。Supabase DashboardでGoogle認証プロバイダーを有効にしてください。')
        } else {
          setError(error.message || 'ログインに失敗しました')
        }
        setLoading(false)
        return
      }

      // 成功時、data.urlが存在する場合は手動でリダイレクト
      if (data?.url) {
        console.log('リダイレクトURL:', data.url)
        window.location.href = data.url
      } else {
        console.warn('data.urlが存在しません。認証フローが正しく開始されていない可能性があります。')
        setError('認証フローを開始できませんでした。環境変数とSupabaseの設定を確認してください。')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('ログインエラー:', error)
      setError(error.message || 'ログインに失敗しました')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center">占いルール管理システム</h1>
          <p className="mt-2 text-center text-gray-600">ログインしてください</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span>ログイン中...</span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Googleでログイン</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-center">占いルール管理システム</h1>
            <p className="mt-2 text-center text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

