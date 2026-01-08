import { createClient } from '@/lib/supabase/server'
import ImageUploadForm from '@/components/ImageUploadForm'
import ImageList from '@/components/ImageList'

export default async function ImagesPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // ルール一覧を取得（紐付け用）
  const { data: rules } = await supabase
    .from('rules')
    .select('id, name')
    .eq('fortune_teller_id', user.id)
    .order('name', { ascending: true })

  // 画像一覧を取得
  const { data: images, error } = await supabase
    .from('images')
    .select(`
      id,
      name,
      file_path,
      url,
      rule_id,
      created_at,
      rules (
        name
      )
    `)
    .eq('fortune_teller_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">画像管理</h1>
      
      <div className="mb-8">
        <ImageUploadForm rules={rules || []} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">画像一覧</h2>
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            エラー: {error.message}
          </div>
        ) : (
          <ImageList images={images || []} />
        )}
      </div>
    </div>
  )
}



