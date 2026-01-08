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

  // LINEやり取りログを取得
  // 注意: 実際の実装では、占い師ごとのログを取得する必要があります
  // 現在は簡易版として、全ログを取得しています
  const { data: logs, error, count } = await supabase
    .from('line_interactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const totalPages = count ? Math.ceil(count / limit) : 1

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">ログ確認</h1>
      
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



