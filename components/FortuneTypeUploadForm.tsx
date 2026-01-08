'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UploadResult {
  success: boolean
  error?: string
  validationErrors?: string[]
  warnings?: string[]
  fortuneType?: any
  isNew?: boolean
}

export default function FortuneTypeUploadForm() {
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jsonText.trim()) {
      setResult({ success: false, error: 'JSON定義を入力してください' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const definition = JSON.parse(jsonText)

      const response = await fetch('/api/fortune-types/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ definition }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          fortuneType: data.fortuneType,
          isNew: data.isNew,
          warnings: data.warnings,
        })
        setJsonText('')
        router.refresh()
      } else {
        setResult({
          success: false,
          error: data.error || 'アップロードに失敗しました',
          validationErrors: data.validationErrors,
          warnings: data.warnings,
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
      fortune_type_id: 'numerology',
      name: '数秘術',
      description: '生年月日から数値を計算して運勢を占う',
      category: '数秘',
      calculation_function: 'supabase/functions/calculate-numerology',
      input_format: {
        birth_date: 'YYYYMMDD形式の生年月日',
      },
      output_format: {
        result_value: '1-9の数値（ライフパスナンバー）',
      },
      message_template_id: 'numerology-template-001',
      is_active: true,
      metadata: {
        author: 'admin',
        version: '1.0.0',
      },
    }
    setJsonText(JSON.stringify(example, null, 2))
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">占いタイプ定義のアップロード</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="json-definition" className="block text-sm font-medium text-gray-700">
              JSON定義 <span className="text-red-500">*</span>
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
            id="json-definition"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder='{"fortune_type_id": "numerology", ...}'
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            FORTUNE_TYPE_SPEC.mdを参照してJSON定義を作成してください。
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
              <p className="font-semibold">
                {result.isNew ? '作成成功！' : '更新成功！'}
              </p>
              <p className="mt-2">
                占いタイプID: {result.fortuneType?.fortune_type_id}
              </p>
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
          )}
        </div>
      )}
    </div>
  )
}



