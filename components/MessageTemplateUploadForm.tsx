'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FortuneType {
  fortune_type_id: string
  name: string
}

interface UploadResult {
  success: boolean
  error?: string
  validationErrors?: string[]
  warnings?: string[]
  missingValues?: number[]
  invalidMessageCounts?: Array<{ result_value: number | string; count: number }>
  missingImages?: Array<{ result_value: number | string; image_id: string }>
  template?: any
  isNew?: boolean
  compiled?: boolean
  compiledCount?: number
  compileError?: string
}

interface MessageTemplateUploadFormProps {
  fortuneTypes: FortuneType[]
}

export default function MessageTemplateUploadForm({ fortuneTypes }: MessageTemplateUploadFormProps) {
  const [selectedFortuneTypeId, setSelectedFortuneTypeId] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFortuneTypeId) {
      setResult({ success: false, error: '占いタイプを選択してください' })
      return
    }

    if (!jsonText.trim()) {
      setResult({ success: false, error: 'JSONテンプレートを入力してください' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const template = JSON.parse(jsonText)

      const response = await fetch('/api/message-templates/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template, fortune_type_id: selectedFortuneTypeId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          template: data.template,
          isNew: data.isNew,
          warnings: data.warnings,
          compiled: data.compiled,
          compiledCount: data.compiledCount,
          compileError: data.compileError,
        })
        setJsonText('')
        setSelectedFortuneTypeId('')
        router.refresh()
      } else {
        setResult({
          success: false,
          error: data.error || 'アップロードに失敗しました',
          validationErrors: data.validationErrors,
          warnings: data.warnings,
          missingValues: data.missingValues,
          invalidMessageCounts: data.invalidMessageCounts,
          missingImages: data.missingImages,
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'JSONの解析に失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadExample = () => {
    const example = {
      template_id: 'numerology-template-001',
      fortune_type_id: selectedFortuneTypeId || 'numerology',
      name: '数秘術 基本テンプレート',
      description: '数秘術の基本的な返信メッセージ',
      templates: [
        {
          result_value: 1,
          messages: [
            {
              type: 'text',
              content: {
                text: 'あなたの数秘は「1」です。\nリーダーシップの数字です。',
              },
            },
            {
              type: 'text',
              content: {
                text: '今月の運勢は、新しいスタートの時期です。',
              },
            },
          ],
        },
      ],
      validation: {
        required_message_count: {
          min: 4,
          max: 5,
        },
        check_image_existence: true,
      },
    }
    setJsonText(JSON.stringify(example, null, 2))
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">返信メッセージテンプレートのアップロード</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fortune-type" className="block text-sm font-medium text-gray-700 mb-1">
            占いタイプ <span className="text-red-500">*</span>
          </label>
          <select
            id="fortune-type"
            value={selectedFortuneTypeId}
            onChange={(e) => setSelectedFortuneTypeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">選択してください</option>
            {fortuneTypes.map((type) => (
              <option key={type.fortune_type_id} value={type.fortune_type_id}>
                {type.name} ({type.fortune_type_id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="json-template" className="block text-sm font-medium text-gray-700">
              JSONテンプレート <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={loadExample}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              サンプルを読み込む
            </button>
          </div>
          <textarea
            id="json-template"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder='{"template_id": "numerology-template-001", ...}'
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            FORTUNE_TYPE_SPEC.mdを参照してJSONテンプレートを作成してください。
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'アップロード・検証・コンパイル中...' : 'アップロード・検証・コンパイル'}
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
              <p className="font-semibold">
                {result.isNew ? '作成成功！' : '更新成功！'}
              </p>
              <p className="mt-2">
                テンプレートID: {result.template?.template_id}
              </p>
              {result.compiled && (
                <p className="mt-2">
                  ✓ 事前コンパイル完了: {result.compiledCount}件のマッピングを作成
                </p>
              )}
              {result.compileError && (
                <p className="mt-2 text-yellow-700">
                  ⚠ コンパイルエラー: {result.compileError}
                </p>
              )}
              {result.warnings && result.warnings.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">警告:</p>
                  <ul className="list-disc list-inside">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
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
              {result.invalidMessageCounts && result.invalidMessageCounts.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">メッセージ数エラー:</p>
                  <ul className="list-disc list-inside">
                    {result.invalidMessageCounts.map((item, idx) => (
                      <li key={idx}>
                        result_value {item.result_value}: {item.count}ブロック（要求: 4-5ブロック）
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.missingImages && result.missingImages.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">存在しない画像ID:</p>
                  <ul className="list-disc list-inside">
                    {result.missingImages.map((item, idx) => (
                      <li key={idx}>
                        result_value {item.result_value}: {item.image_id}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}



