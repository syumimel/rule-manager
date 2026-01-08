'use client'

interface Template {
  id: string
  template_id: string
  fortune_type_id: string
  name: string
  description: string | null
  is_validated: boolean
  created_at: string
}

interface MessageTemplateListProps {
  templates: Template[]
}

export default function MessageTemplateList({ templates }: MessageTemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        まだテンプレートが登録されていません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div key={template.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">ID: {template.template_id}</p>
              <p className="text-sm text-gray-600 mt-1">
                占いタイプ: {template.fortune_type_id}
              </p>
              {template.description && (
                <p className="text-sm text-gray-600 mt-2">{template.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                作成日: {new Date(template.created_at).toLocaleString('ja-JP')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {template.is_validated ? (
                <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                  検証済み
                </span>
              ) : (
                <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded">
                  未検証
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}



