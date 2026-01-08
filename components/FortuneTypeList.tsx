'use client'

interface FortuneType {
  id: string
  fortune_type_id: string
  name: string
  description: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

interface FortuneTypeListProps {
  fortuneTypes: FortuneType[]
}

export default function FortuneTypeList({ fortuneTypes }: FortuneTypeListProps) {
  if (fortuneTypes.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        まだ占いタイプが登録されていません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {fortuneTypes.map((type) => (
        <div key={type.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{type.name}</h3>
              <p className="text-sm text-gray-600 mt-1">ID: {type.fortune_type_id}</p>
              {type.category && (
                <p className="text-sm text-gray-500 mt-1">カテゴリ: {type.category}</p>
              )}
              {type.description && (
                <p className="text-sm text-gray-600 mt-2">{type.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                作成日: {new Date(type.created_at).toLocaleString('ja-JP')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {type.is_active ? (
                <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                  有効
                </span>
              ) : (
                <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded">
                  無効
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}



