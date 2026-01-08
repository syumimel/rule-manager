import { createClient } from '@supabase/supabase-js'

/**
 * Service Role Keyを使用したSupabaseクライアント
 * RLSをバイパスしてデータベース操作を実行する場合に使用
 * ⚠️ セキュリティ: このクライアントはサーバーサイドでのみ使用してください
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.\n' +
      'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY\n' +
      'See: https://supabase.com/dashboard/project/_/settings/api'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}



