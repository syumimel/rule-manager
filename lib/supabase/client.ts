import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.\n' +
      'Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'See: https://supabase.com/dashboard/project/_/settings/api'
    )
  }

  // Cookieベースのストレージを使用してPKCE code verifierを保存
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        return document.cookie.split(';').map(cookie => {
          const [name, ...valueParts] = cookie.trim().split('=')
          const value = valueParts.join('=') // '='が含まれる値に対応
          return { name: name.trim(), value: decodeURIComponent(value || '') }
        })
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        cookiesToSet.forEach(({ name, value, options }) => {
          const expires = options?.maxAge 
            ? new Date(Date.now() + options.maxAge * 1000).toUTCString()
            : options?.expires?.toUTCString() || new Date(Date.now() + 30 * 60 * 1000).toUTCString()
          const secureFlag = options?.secure || process.env.NODE_ENV === 'production' ? '; Secure' : ''
          const sameSite = options?.sameSite || 'Lax'
          const path = options?.path || '/'
          document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=${sameSite}${secureFlag}`
        })
      },
    },
  })
}

