'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Generation {
  id: string
  generation_number: number
  uploaded_at: string
  uploaded_by: string
  row_count: number
  is_active: boolean
  is_archived: boolean
}

interface Rule {
  id: string
  name: string
  category: string | null
  created_at: string
  updated_at: string
}

interface RuleDetailProps {
  rule: Rule
  generations: Generation[]
}

export default function RuleDetail({ rule, generations }: RuleDetailProps) {
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(
    generations.length > 0 ? generations[0].id : null
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const selectedGeneration = generations.find((g) => g.id === selectedGenerationId)

  const handleGenerationSelect = async (generationId: string) => {
    setSelectedGenerationId(generationId)
    setLoading(true)
    setPreviewRows([])

    try {
      const response = await fetch(`/api/rules/generations/${generationId}/rows?limit=50`)
      const data = await response.json()

      if (data.success) {
        setPreviewRows(data.rows || [])
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (generationId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/rules/generations/${generationId}/toggle-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentActive }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('有効化/無効化に失敗しました:', error)
    }
  }

  // 検索フィルタ
  const filteredGenerations = generations.filter((gen) => {
    if (!searchTerm) return true
    return gen.generation_number.toString().includes(searchTerm)
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{rule.name}</h1>
        {rule.category && (
          <p className="text-gray-600 mt-1">カテゴリ: {rule.category}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          作成日: {new Date(rule.created_at).toLocaleString('ja-JP')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 世代一覧 */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">世代一覧（最大6世代）</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="世代番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              {filteredGenerations.length === 0 ? (
                <p className="text-sm text-gray-500">世代がありません</p>
              ) : (
                filteredGenerations.map((gen) => (
                  <div
                    key={gen.id}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      selectedGenerationId === gen.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleGenerationSelect(gen.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">世代 {gen.generation_number}</span>
                      {gen.is_active && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          有効
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{new Date(gen.uploaded_at).toLocaleString('ja-JP')}</p>
                      <p>{gen.row_count}行</p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleActive(gen.id, gen.is_active)
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          gen.is_active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {gen.is_active ? '無効化' : '有効化'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* プレビュー */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              {selectedGeneration
                ? `世代 ${selectedGeneration.generation_number} のプレビュー`
                : '世代を選択してください'}
            </h2>

            {selectedGeneration && (
              <div className="mb-4 text-xs text-gray-600">
                <p>総行数: {selectedGeneration.row_count}行</p>
                <p>アップロード日時: {new Date(selectedGeneration.uploaded_at).toLocaleString('ja-JP')}</p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500">読み込み中...</p>
              </div>
            ) : previewRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {previewRows[0] && Object.keys(previewRows[0].data).map((key) => (
                        <th key={key} className="px-2 py-1 text-left border font-semibold">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        {Object.values(row.data).map((value: any, idx) => (
                          <td key={idx} className="px-2 py-1 border">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-4 text-xs text-gray-500">
                  先頭50行を表示しています（全{selectedGeneration?.row_count}行）
                </p>
              </div>
            ) : selectedGeneration ? (
              <div className="text-center py-8 text-xs text-gray-500">
                データがありません
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-500">
                左側から世代を選択してください
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

