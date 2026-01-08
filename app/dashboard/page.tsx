import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 統計情報を取得
  const [rulesResult, generationsResult, imagesResult, recentUploadsResult] = await Promise.all([
    // 有効ルール数
    supabase
      .from('rules')
      .select('id', { count: 'exact' })
      .eq('fortune_teller_id', user.id),
    
    // 総世代数
    supabase
      .from('rule_generations')
      .select('id', { count: 'exact' })
      .eq('uploaded_by', user.id),
    
    // 画像総数
    supabase
      .from('images')
      .select('id', { count: 'exact' })
      .eq('fortune_teller_id', user.id),
    
    // 最新アップロード（直近5件）
    supabase
      .from('rule_generations')
      .select(`
        id,
        generation_number,
        uploaded_at,
        row_count,
        rules!inner (
          id,
          name,
          fortune_teller_id
        )
      `)
      .eq('rules.fortune_teller_id', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(5),
  ])

  const stats = {
    activeRules: rulesResult.count || 0,
    totalGenerations: generationsResult.count || 0,
    totalImages: imagesResult.count || 0,
    recentUploads: recentUploadsResult.data || [],
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">有効ルール数</h2>
          <p className="text-3xl font-bold">{stats.activeRules}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">総世代数</h2>
          <p className="text-3xl font-bold">{stats.totalGenerations}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">画像総数</h2>
          <p className="text-3xl font-bold">{stats.totalImages}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">最新アップロード</h2>
        {stats.recentUploads.length === 0 ? (
          <p className="text-gray-500">まだアップロードがありません</p>
        ) : (
          <div className="space-y-3">
            {stats.recentUploads.map((upload: any) => (
              <div key={upload.id} className="border-b pb-3 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{upload.rules?.name || '不明'}</p>
                    <p className="text-sm text-gray-600">
                      世代 {upload.generation_number} - {upload.row_count}行
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(upload.uploaded_at).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

