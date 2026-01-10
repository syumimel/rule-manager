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
  images?: any[]
  warning?: string
}

interface ImageUploadFormProps {
  rules: Rule[]
}

export default function ImageUploadForm({ rules }: ImageUploadFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [name, setName] = useState('')
  const [selectedRuleId, setSelectedRuleId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files)
      setFiles(fileArray)
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
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
      // 複数ファイルを順番にアップロード
      const results = []
      const errors = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 画像名に連番を付与（3桁のゼロ埋め）
        const suffix = files.length > 1 ? `_${String(i + 1).padStart(3, '0')}` : ''
        const imageName = `${name.trim()}${suffix}`

        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', imageName)
        if (selectedRuleId) {
          formData.append('ruleId', selectedRuleId)
        }

        const response = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (response.ok && data.success) {
          results.push(data.image)
        } else {
          errors.push(`${imageName}: ${data.error || 'アップロードに失敗しました'}`)
        }
      }

      if (results.length > 0) {
        setResult({
          success: true,
          image: results[0], // 最初の画像をプレビュー用に表示
          images: results, // 全画像の情報を保持
        })
        // フォームをリセット
        setFiles([])
        setName('')
        setSelectedRuleId('')
        const fileInput = document.getElementById('image-file') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
        
        if (errors.length > 0) {
          setResult({
            success: true,
            image: results[0],
            images: results,
            warning: `${results.length}件のアップロード成功。${errors.length}件失敗: ${errors.join(', ')}`,
          })
        }
        
        router.refresh()
      } else {
        setResult({
          success: false,
          error: errors.length > 0 ? errors.join(', ') : 'アップロードに失敗しました',
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
            multiple
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            JPEG、PNG、GIF形式、最大10MBまで対応。複数選択可能（複数の場合、画像名に自動で連番を付与します）
          </p>
          {files.length > 0 && (
            <div className="mt-2 text-sm text-blue-600">
              選択中: {files.length}件のファイル
              {files.length > 1 && `（画像名: ${name.trim()}_001 〜 ${name.trim()}_${String(files.length).padStart(3, '0')}）`}
            </div>
          )}
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
              {result.warning && (
                <p className="mt-2 text-yellow-700 bg-yellow-50 p-2 rounded">{result.warning}</p>
              )}
              {result.image && (
                <div className="mt-2">
                  <img
                    src={result.image.url}
                    alt={result.image.name}
                    className="max-w-xs rounded"
                  />
                  <p className="mt-1 text-sm">画像名: {result.image.name}</p>
                </div>
              )}
              {result.images && result.images.length > 1 && (
                <div className="mt-2 text-sm">
                  <p>アップロードされた画像: {result.images.length}件</p>
                  <ul className="mt-1 list-disc list-inside">
                    {result.images.map((img: any, idx: number) => (
                      <li key={idx}>{img.name}</li>
                    ))}
                  </ul>
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



