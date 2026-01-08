import { createClient } from '@/lib/supabase/server'
import RulesUploadForm from '@/components/RulesUploadForm'
import RulesList from '@/components/RulesList'

export default async function RulesPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // ルール一覧を取得
  const { data: rules, error } = await supabase
    .from('rules')
    .select(`
      id,
      name,
      category,
      created_at,
      rule_generations (
        id,
        generation_number,
        uploaded_at,
        row_count,
        is_active
      )
    `)
    .eq('fortune_teller_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">占いルール管理</h1>
      
      <div className="mb-8">
        <RulesUploadForm />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">ルール一覧</h2>
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            エラー: {error.message}
          </div>
        ) : (
          <RulesList rules={rules || []} />
        )}
      </div>
    </div>
  )
}



