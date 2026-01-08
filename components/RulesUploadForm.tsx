'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UploadResult {
  success: boolean
  error?: string
  validationErrors?: string[]
  ruleId?: string
  generationId?: string
  rowCount?: number
  preview?: Array<{ rowNumber: number; data: Record<string, any> }>
}

export default function RulesUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [ruleName, setRuleName] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setResult({ success: false, error: 'ファイルを選択してください' })
      return
    }

    if (!ruleName.trim()) {
      setResult({ success: false, error: 'ルール名を入力してください' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('ruleName', ruleName)
      if (category) {
        formData.append('category', category)
      }

      const response = await fetch('/api/rules/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          ruleId: data.ruleId,
          generationId: data.generationId,
          rowCount: data.rowCount,
          preview: data.preview,
        })
        // フォームをリセット
        setFile(null)
        setRuleName('')
        setCategory('')
        // ファイル入力もリセット
        const fileInput = document.getElementById('csv-file') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
        // ページをリロードして一覧を更新
        router.refresh()
      } else {
        setResult({
          success: false,
          error: data.error || 'アップロードに失敗しました',
          validationErrors: data.validationErrors,
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'アップロードに失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">CSVアップロード</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rule-name" className="block text-sm font-medium text-gray-700 mb-1">
            ルール名 <span className="text-red-500">*</span>
          </label>
          <input
            id="rule-name"
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 数秘、タロット、四柱推命"
          />
        </div>

        <div>
          <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-1">
            CSVファイル <span className="text-red-500">*</span>
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            最大4000行、20列まで対応。UTF-8形式のCSVファイルをアップロードしてください。
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'アップロード中...' : 'アップロード'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded ${
          result.success
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {result.success ? (
            <div>
              <p className="font-semibold">アップロード成功！</p>
              <p className="mt-2">行数: {result.rowCount}行</p>
              {result.preview && result.preview.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2 text-sm">プレビュー（先頭10行）:</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          {Object.keys(result.preview[0].data).map((key) => (
                            <th key={key} className="px-2 py-1 text-left border">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.preview.map((row) => (
                          <tr key={row.rowNumber}>
                            {Object.values(row.data).map((value, idx) => (
                              <td key={idx} className="px-2 py-1 border">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="font-semibold">アップロード失敗</p>
              <p className="mt-2">{result.error}</p>
              {result.validationErrors && result.validationErrors.length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {result.validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

