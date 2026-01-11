'use client'

import { useEffect, useState } from 'react'
import { AutoReply, AutoReplyInput } from '@/lib/auto-reply/manager'

export default function AutoRepliesPage() {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AutoReplyInput>({
    keyword: '',
    reply_type: 'text',
    reply_text: '',
    reply_json: null,
    is_active: true,
    priority: 0,
    match_type: 'contains',
  })
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 自動返信一覧を取得
  const fetchAutoReplies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auto-replies')
      if (!response.ok) throw new Error('Failed to fetch auto replies')
      const data = await response.json()
      setAutoReplies(data.autoReplies || [])
    } catch (error: any) {
      console.error('Failed to fetch auto replies:', error)
      setError('自動返信の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAutoReplies()
  }, [])

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      keyword: '',
      reply_type: 'text',
      reply_text: '',
      reply_json: null,
      is_active: true,
      priority: 0,
      match_type: 'contains',
    })
    setJsonInput('')
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  // 編集開始
  const handleEdit = (autoReply: AutoReply) => {
    setFormData({
      keyword: autoReply.keyword,
      reply_type: autoReply.reply_type,
      reply_text: autoReply.reply_text || '',
      reply_json: autoReply.reply_json || null,
      is_active: autoReply.is_active,
      priority: autoReply.priority,
      match_type: autoReply.match_type,
    })
    if (autoReply.reply_type === 'json' && autoReply.reply_json) {
      // __vars__が配列形式の場合、オブジェクト形式に変換して表示
      const replyJson = autoReply.reply_json as any
      const displayJson = Array.isArray(replyJson) ? replyJson : { ...replyJson }
      if (!Array.isArray(displayJson) && displayJson.__vars__ && Array.isArray(displayJson.__vars__)) {
        const varsObj: Record<string, any> = {}
        for (const item of displayJson.__vars__) {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            // [{"row_idx": "${rand:1:100}"}, ...] 形式からオブジェクト形式に変換
            for (const [key, value] of Object.entries(item)) {
              varsObj[key] = value
              break // 最初のキー-値ペアのみを使用
            }
          }
        }
        displayJson.__vars__ = varsObj
      }
      setJsonInput(JSON.stringify(displayJson, null, 2))
    } else {
      setJsonInput('')
    }
    setEditingId(autoReply.id)
    setShowForm(true)
    setError(null)
  }

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('この自動返信を削除しますか？')) return

    try {
      const response = await fetch(`/api/auto-replies/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete auto reply')

      await fetchAutoReplies()
    } catch (error: any) {
      console.error('Failed to delete auto reply:', error)
      alert('削除に失敗しました')
    }
  }

  // 送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // バリデーション
      if (!formData.keyword.trim()) {
        setError('キーワードを入力してください')
        setSubmitting(false)
        return
      }

      let submitData: any = { ...formData }

      if (formData.reply_type === 'text') {
        if (!formData.reply_text?.trim()) {
          setError('返信内容を入力してください')
          setSubmitting(false)
          return
        }
        submitData.reply_text = formData.reply_text
        submitData.reply_json = null
      } else if (formData.reply_type === 'json') {
        if (!jsonInput.trim()) {
          setError('JSONを入力してください')
          setSubmitting(false)
          return
        }

        try {
          const parsed = JSON.parse(jsonInput.trim())
          
          // 配列形式または__vars__と__messages__形式を許可
          if (Array.isArray(parsed)) {
            // 配列形式（直接メッセージ配列）
            submitData.reply_json = parsed
          } else if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) && '__messages__' in parsed) {
            // __vars__と__messages__形式
            if (!Array.isArray(parsed.__messages__)) {
              setError('__messages__は配列形式である必要があります')
              setSubmitting(false)
              return
            }
            
            // __vars__がオブジェクト形式の場合、配列形式に変換して順序を保持
            if ('__vars__' in parsed && parsed.__vars__ && typeof parsed.__vars__ === 'object' && !Array.isArray(parsed.__vars__)) {
              const varsObj = parsed.__vars__
              // [{"row_idx": "${rand:1:100}"}, {"sasaki": "${row_idx}"}, ...] の形式に変換
              const varsArray = Object.entries(varsObj).map(([key, value]) => {
                const item: Record<string, any> = {}
                item[key] = value
                return item
              })
              parsed.__vars__ = varsArray
            }
            
            submitData.reply_json = parsed
          } else {
            setError('JSONは配列形式、または__vars__と__messages__を含むオブジェクト形式である必要があります')
            setSubmitting(false)
            return
          }
          submitData.reply_text = null
        } catch (parseError) {
          setError('JSON形式が正しくありません')
          setSubmitting(false)
          return
        }
      }

      const url = editingId
        ? `/api/auto-replies/${editingId}`
        : '/api/auto-replies'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save auto reply')
      }

      resetForm()
      await fetchAutoReplies()
    } catch (error: any) {
      console.error('Failed to save auto reply:', error)
      setError(error.message || '保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  // 有効/無効切り替え
  const handleToggleActive = async (autoReply: AutoReply) => {
    try {
      const response = await fetch(`/api/auto-replies/${autoReply.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...autoReply,
          is_active: !autoReply.is_active,
        }),
      })

      if (!response.ok) throw new Error('Failed to update auto reply')

      await fetchAutoReplies()
    } catch (error: any) {
      console.error('Failed to toggle active:', error)
      alert('更新に失敗しました')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">自動返信管理</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          新規登録
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 bg-white border border-gray-300 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? '自動返信を編集' : '自動返信を新規登録'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                キーワード *
              </label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) =>
                  setFormData({ ...formData, keyword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                マッチング方式
              </label>
              <select
                value={formData.match_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    match_type: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded"
              >
                <option value="contains">含む（contains）</option>
                <option value="exact">完全一致（exact）</option>
                <option value="starts_with">前方一致（starts_with）</option>
                <option value="ends_with">後方一致（ends_with）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                返信タイプ *
              </label>
              <select
                value={formData.reply_type}
                onChange={(e) => {
                  const replyType = e.target.value as 'text' | 'json'
                  setFormData({
                    ...formData,
                    reply_type: replyType,
                    reply_text: replyType === 'text' ? formData.reply_text : '',
                    reply_json: replyType === 'json' ? formData.reply_json : null,
                  })
                  if (replyType === 'json' && !jsonInput) {
                    setJsonInput('[\n  {\n    "type": "text",\n    "text": "こんにちは"\n  }\n]')
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              >
                <option value="text">テキスト</option>
                <option value="json">JSON（LINE Messaging API形式）</option>
              </select>
            </div>

            {formData.reply_type === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  返信内容（テキスト） *
                </label>
                <textarea
                  value={formData.reply_text || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, reply_text: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  rows={5}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  返信内容（JSON） *
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`例1（配列形式）:\n[\n  {\n    "type": "text",\n    "text": "こんにちは"\n  }\n]\n\n例2（__vars__と__messages__形式）:\n{\n  "__vars__": {\n    "userName": "田中",\n    "row_idx": "\${rand:1:100}"\n  },\n  "__messages__": [\n    {"type": "text", "text": "こんにちは、\${userName}さん！"},\n    {"type": "text", "text": "ラッキーナンバーは\${row_idx}です✨"}\n  ]\n}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded font-mono text-sm"
                  rows={12}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  LINE Messaging API形式のJSONを入力（最大5メッセージ）<br />
                  配列形式、または__vars__と__messages__を含むオブジェクト形式が使用できます
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  優先順位（数値が大きいほど優先）
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    有効
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2 rounded ${
                  submitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {submitting ? '保存中...' : editingId ? '更新' : '登録'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : autoReplies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          自動返信が登録されていません
        </div>
      ) : (
        <div className="space-y-4">
          {autoReplies.map((autoReply) => (
            <div
              key={autoReply.id}
              className="p-4 bg-white border border-gray-300 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{autoReply.keyword}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {autoReply.match_type}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 rounded">
                      {autoReply.reply_type}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      優先度: {autoReply.priority}
                    </span>
                    {autoReply.is_active ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        有効
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                        無効
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {autoReply.reply_type === 'text' ? (
                      <div className="whitespace-pre-wrap">
                        {autoReply.reply_text}
                      </div>
                    ) : (
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(autoReply.reply_json, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(autoReply)}
                    className={`px-3 py-1 text-sm rounded ${
                      autoReply.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {autoReply.is_active ? '無効化' : '有効化'}
                  </button>
                  <button
                    onClick={() => handleEdit(autoReply)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(autoReply.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


