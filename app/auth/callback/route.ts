import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
  }

  const cookieStore = await cookies()
  
  // リダイレクトレスポンスを先に作成（Cookieを設定するため）
  const redirectResponse = NextResponse.redirect(new URL(next, requestUrl.origin))
  
  // Supabaseクライアントを作成（認証コールバック用）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // CookieをcookieStoreとredirectResponseの両方に設定
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  
  // 認証コードをセッションに交換
  const { error, data } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error('認証エラー:', error)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
    )
  }

  // セッションが正しく設定されたか確認
  if (!data.session) {
    console.error('セッションが作成されませんでした')
    return NextResponse.redirect(new URL('/login?error=session_failed', requestUrl.origin))
  }

  // ユーザー情報を確認
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('ユーザー取得エラー:', userError)
    return NextResponse.redirect(new URL('/login?error=user_fetch_failed', requestUrl.origin))
  }

  console.log('認証成功:', user.email)
  console.log('リダイレクト先:', next)

  // Cookieが設定されたレスポンスを返す
  return redirectResponse
}
