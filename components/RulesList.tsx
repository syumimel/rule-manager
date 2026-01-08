'use client'

import Link from 'next/link'

interface RuleGeneration {
  id: string
  generation_number: number
  uploaded_at: string
  row_count: number
  is_active: boolean
}

interface Rule {
  id: string
  name: string
  category: string | null
  created_at: string
  rule_generations: RuleGeneration[]
}

interface RulesListProps {
  rules: Rule[]
}

export default function RulesList({ rules }: RulesListProps) {
  if (rules.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        まだルールが登録されていません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div key={rule.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{rule.name}</h3>
              {rule.category && (
                <p className="text-sm text-gray-500 mt-1">カテゴリ: {rule.category}</p>
              )}
            </div>
            <Link
              href={`/dashboard/rules/${rule.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              詳細を見る →
            </Link>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">世代一覧</h4>
            {rule.rule_generations && rule.rule_generations.length > 0 ? (
              <div className="space-y-2">
                {rule.rule_generations
                  .sort((a, b) => b.generation_number - a.generation_number)
                  .map((gen) => (
                    <div
                      key={gen.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          世代 {gen.generation_number}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(gen.uploaded_at).toLocaleString('ja-JP')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {gen.row_count}行
                        </span>
                        {gen.is_active && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            有効
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">世代がありません</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}



