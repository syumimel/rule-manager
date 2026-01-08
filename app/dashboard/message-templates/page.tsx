import { createClient } from '@/lib/supabase/server'
import MessageTemplateUploadForm from '@/components/MessageTemplateUploadForm'
import MessageTemplateList from '@/components/MessageTemplateList'

export default async function MessageTemplatesPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // 占いタイプ一覧を取得（テンプレート選択用）
  const { data: fortuneTypes } = await supabase
    .from('fortune_types')
    .select('fortune_type_id, name')
    .eq('fortune_teller_id', user.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // メッセージテンプレート一覧を取得
  const { data: templates, error } = await supabase
    .from('fortune_message_templates')
    .select(`
      id,
      template_id,
      fortune_type_id,
      name,
      description,
      is_validated,
      created_at,
      fortune_types!inner (
        fortune_teller_id
      )
    `)
    .eq('fortune_types.fortune_teller_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">返信メッセージテンプレート管理</h1>
      
      <div className="mb-8">
        <MessageTemplateUploadForm fortuneTypes={fortuneTypes || []} />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">テンプレート一覧</h2>
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            エラー: {error.message}
          </div>
        ) : (
          <MessageTemplateList templates={templates || []} />
        )}
      </div>
    </div>
  )
}



