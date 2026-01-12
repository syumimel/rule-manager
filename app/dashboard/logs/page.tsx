import { createClient } from '@/lib/supabase/server'
import LogsList from '@/components/LogsList'

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const page = parseInt(searchParams.page as string) || 1
  const limit = 50
  const offset = (page - 1) * limit

  // message_logsテーブルから送信/受信メッセージを取得
  // ログインしているユーザーのメッセージのみ取得
  const { data: logs, error, count } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact' })
    .eq('fortune_teller_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">メッセージログ</h1>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          エラー: {error.message}
        </div>
      ) : (
        <LogsList logs={logs || []} currentPage={page} totalPages={totalPages} />
      )}
    </div>
  )
}



