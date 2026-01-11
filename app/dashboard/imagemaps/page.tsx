'use client'

import { useEffect, useState } from 'react'
import { Imagemap, ImagemapAction } from '@/lib/imagemap/types'

export default function ImagemapsPage() {
  const [imagemaps, setImagemaps] = useState<Imagemap[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    folder_id: '',
    name: '',
    alt_text: '',
    base_width: 1040,
    base_height: 1040,
    actions: [] as ImagemapAction[],
    video: null as any,
    is_active: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // イメージマップ一覧を取得
  const fetchImagemaps = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/imagemaps')
      if (!response.ok) throw new Error('Failed to fetch imagemaps')
      const data = await response.json()
      setImagemaps(data.imagemaps || [])
    } catch (error: any) {
      console.error('Failed to fetch imagemaps:', error)
      setError('イメージマップの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImagemaps()
  }, [])

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      folder_id: '',
      name: '',
      alt_text: '',
      base_width: 1040,
      base_height: 1040,
      actions: [],
      video: null,
      is_active: true,
    })
    setImageFile(null)
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  // 画像アップロード
  const handleImageUpload = async () => {
    if (!imageFile || !formData.folder_id) {
      setError('画像とフォルダーIDを入力してください')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const uploadFormData = new FormData()
      uploadFormData.append('image', imageFile)
      uploadFormData.append('folder_id', formData.folder_id)
      uploadFormData.append('width', formData.base_width.toString())
      uploadFormData.append('height', formData.base_height.toString())

      const response = await fetch('/api/imagemaps/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload images')
      }

      alert('画像のアップロードが完了しました。複数サイズの画像が生成されました。')
    } catch (error: any) {
      console.error('Failed to upload images:', error)
      setError(error.message || '画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  // 編集開始
  const handleEdit = (imagemap: Imagemap) => {
    setFormData({
      folder_id: imagemap.folder_id,
      name: imagemap.name,
      alt_text: imagemap.alt_text,
      base_width: imagemap.base_width,
      base_height: imagemap.base_height,
      actions: imagemap.actions || [],
      video: imagemap.video,
      is_active: imagemap.is_active,
    })
    setEditingId(imagemap.id)
    setShowForm(true)
    setError(null)
  }

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('このイメージマップを削除しますか？')) return

    try {
      const response = await fetch(`/api/imagemaps/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete imagemap')

      await fetchImagemaps()
    } catch (error: any) {
      console.error('Failed to delete imagemap:', error)
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
      if (!formData.folder_id.trim()) {
        setError('フォルダーIDを入力してください')
        return
      }
      if (!formData.name.trim()) {
        setError('名前を入力してください')
        return
      }
      if (!formData.alt_text.trim()) {
        setError('代替テキストを入力してください')
        return
      }

      const url = editingId
        ? `/api/imagemaps/${editingId}`
        : '/api/imagemaps'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save imagemap')
      }

      resetForm()
      await fetchImagemaps()
    } catch (error: any) {
      console.error('Failed to save imagemap:', error)
      setError(error.message || '保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  // アクション追加
  const handleAddAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        {
          type: 'message',
          text: '',
          area: { x: 0, y: 0, width: 520, height: 520 },
        },
      ],
    })
  }

  // アクション削除
  const handleRemoveAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    })
  }

  // アクション更新
  const handleUpdateAction = (index: number, action: ImagemapAction) => {
    const newActions = [...formData.actions]
    newActions[index] = action
    setFormData({ ...formData, actions: newActions })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">イメージマップ管理</h1>
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
        <div className="mb-8 p-6 bg-white border border-gray-300 rounded-lg space-y-6">
          <h2 className="text-xl font-semibold">
            {editingId ? 'イメージマップを編集' : 'イメージマップを新規登録'}
          </h2>

          {/* 画像アップロードセクション */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">画像アップロード</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  フォルダーID *
                </label>
                <input
                  type="text"
                  value={formData.folder_id}
                  onChange={(e) =>
                    setFormData({ ...formData, folder_id: e.target.value })
                  }
                  placeholder="例: rm001"
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  英数字とハイフンのみ使用可能
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ベース画像 *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setImageFile(file)
                      // 画像のサイズを取得
                      const img = new Image()
                      img.onload = () => {
                        setFormData({
                          ...formData,
                          base_width: img.width,
                          base_height: img.height,
                        })
                      }
                      img.src = URL.createObjectURL(file)
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  推奨: 幅1040px、JPEG形式
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    幅 (width)
                  </label>
                  <input
                    type="number"
                    value={formData.base_width}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_width: parseInt(e.target.value) || 1040,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    高さ (height)
                  </label>
                  <input
                    type="number"
                    value={formData.base_height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_height: parseInt(e.target.value) || 1040,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleImageUpload}
                disabled={!imageFile || !formData.folder_id || uploading}
                className={`px-4 py-2 rounded ${
                  !imageFile || !formData.folder_id || uploading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {uploading ? 'アップロード中...' : '画像をアップロード（複数サイズ生成）'}
              </button>
              <p className="text-xs text-gray-500">
                アップロードすると、240px, 300px, 460px, 700px, 1040px の画像が自動生成されます
              </p>
            </div>
          </div>

          {/* 基本情報 */}
          <form onSubmit={handleSubmit} className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名前 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                代替テキスト (altText) *
              </label>
              <input
                type="text"
                value={formData.alt_text}
                onChange={(e) =>
                  setFormData({ ...formData, alt_text: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            {/* アクション設定 */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">アクション</h3>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  アクション追加
                </button>
              </div>

              {formData.actions.map((action, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">アクション {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        タイプ
                      </label>
                      <select
                        value={action.type}
                        onChange={(e) =>
                          handleUpdateAction(index, {
                            ...action,
                            type: e.target.value as 'uri' | 'message',
                          })
                        }
                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="message">メッセージ</option>
                        <option value="uri">URI</option>
                      </select>
                    </div>

                    {action.type === 'message' ? (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          メッセージテキスト
                        </label>
                        <input
                          type="text"
                          value={action.text || ''}
                          onChange={(e) =>
                            handleUpdateAction(index, {
                              ...action,
                              text: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          URI
                        </label>
                        <input
                          type="url"
                          value={action.linkUri || ''}
                          onChange={(e) =>
                            handleUpdateAction(index, {
                              ...action,
                              linkUri: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          X
                        </label>
                        <input
                          type="number"
                          value={action.area.x}
                          onChange={(e) =>
                            handleUpdateAction(index, {
                              ...action,
                              area: {
                                ...action.area,
                                x: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Y
                        </label>
                        <input
                          type="number"
                          value={action.area.y}
                          onChange={(e) =>
                            handleUpdateAction(index, {
                              ...action,
                              area: {
                                ...action.area,
                                y: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Width
                        </label>
                        <input
                          type="number"
                          value={action.area.width}
                          onChange={(e) =>
                            handleUpdateAction(index, {
                              ...action,
                              area: {
                                ...action.area,
                                width: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Height
                        </label>
                        <input
                          type="number"
                          value={action.area.height}
                          onChange={(e) =>
                            handleUpdateAction(index, {
                              ...action,
                              area: {
                                ...action.area,
                                height: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
      ) : imagemaps.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          イメージマップが登録されていません
        </div>
      ) : (
        <div className="space-y-4">
          {imagemaps.map((imagemap) => (
            <div
              key={imagemap.id}
              className="p-4 bg-white border border-gray-300 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{imagemap.name}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {imagemap.folder_id}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {imagemap.base_width} × {imagemap.base_height}
                    </span>
                    {imagemap.is_active ? (
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
                    <div>altText: {imagemap.alt_text}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      baseUrl: {imagemap.base_url}
                    </div>
                    <div className="text-xs text-gray-500">
                      アクション数: {imagemap.actions?.length || 0}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(imagemap)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(imagemap.id)}
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



