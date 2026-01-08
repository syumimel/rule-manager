'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Rule {
  id: string
  name: string
}

interface UploadResult {
  success: boolean
  error?: string
  image?: any
}

interface ImageUploadFormProps {
  rules: Rule[]
}

export default function ImageUploadForm({ rules }: ImageUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [selectedRuleId, setSelectedRuleId] = useState('')
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

    if (!name.trim()) {
      setResult({ success: false, error: '画像名を入力してください' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      if (selectedRuleId) {
        formData.append('ruleId', selectedRuleId)
      }

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          image: data.image,
        })
        // フォームをリセット
        setFile(null)
        setName('')
        setSelectedRuleId('')
        const fileInput = document.getElementById('image-file') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
        router.refresh()
      } else {
        setResult({
          success: false,
          error: data.error || 'アップロードに失敗しました',
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
      <h2 className="text-xl font-semibold mb-4">画像アップロード</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="image-name" className="block text-sm font-medium text-gray-700 mb-1">
            画像名 <span className="text-red-500">*</span>
          </label>
          <input
            id="image-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="rule-select" className="block text-sm font-medium text-gray-700 mb-1">
            ルールへの紐付け（任意）
          </label>
          <select
            id="rule-select"
            value={selectedRuleId}
            onChange={(e) => setSelectedRuleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">紐付けなし</option>
            {rules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="image-file" className="block text-sm font-medium text-gray-700 mb-1">
            画像ファイル <span className="text-red-500">*</span>
          </label>
          <input
            id="image-file"
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            JPEG、PNG、GIF形式、最大10MBまで対応
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
              {result.image && (
                <div className="mt-2">
                  <img
                    src={result.image.url}
                    alt={result.image.name}
                    className="max-w-xs rounded"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="font-semibold">アップロード失敗</p>
              <p className="mt-2">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



