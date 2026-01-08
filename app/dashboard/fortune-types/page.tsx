import { createClient } from '@/lib/supabase/server'
import FortuneTypeUploadForm from '@/components/FortuneTypeUploadForm'
import FortuneTypeList from '@/components/FortuneTypeList'

export default async function FortuneTypesPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 占いタイプ一覧を取得
  const { data: fortuneTypes, error } = await supabase
    .from('fortune_types')
    .select('id, fortune_type_id, name, description, category, is_active, created_at')
    .eq('fortune_teller_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">占いタイプ管理</h1>
      
      <div className="mb-8">
        <FortuneTypeUploadForm />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">占いタイプ一覧</h2>
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            エラー: {error.message}
          </div>
        ) : (
          <FortuneTypeList fortuneTypes={fortuneTypes || []} />
        )}
      </div>
    </div>
  )
}



