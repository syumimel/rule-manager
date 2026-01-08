'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LineSettings {
  channel_id?: string
  channel_secret?: string
}

interface LineSettingsFormProps {
  initialSettings?: LineSettings | null
}

export default function LineSettingsForm({ initialSettings }: LineSettingsFormProps) {
  const [channelId, setChannelId] = useState(initialSettings?.channel_id || '')
  const [channelSecret, setChannelSecret] = useState(initialSettings?.channel_secret || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!channelId.trim()) {
      setResult({ success: false, error: 'Channel IDを入力してください' })
      return
    }

    if (!channelSecret.trim()) {
      setResult({ success: false, error: 'Channel Secretを入力してください' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/line/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_id: channelId,
          channel_secret: channelSecret,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({ success: true })
        router.refresh()
      } else {
        setResult({
          success: false,
          error: data.error || '設定の保存に失敗しました',
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || '設定の保存に失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">LINE連携設定</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="channel-id" className="block text-sm font-medium text-gray-700 mb-1">
            Channel ID <span className="text-red-500">*</span>
          </label>
          <input
            id="channel-id"
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            LINE Developers Consoleで取得したChannel IDを入力してください
          </p>
        </div>

        <div>
          <label htmlFor="channel-secret" className="block text-sm font-medium text-gray-700 mb-1">
            Channel Secret <span className="text-red-500">*</span>
          </label>
          <input
            id="channel-secret"
            type="password"
            value={channelSecret}
            onChange={(e) => setChannelSecret(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            LINE Developers Consoleで取得したChannel Secretを入力してください
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <p className="text-sm text-blue-800">
            <strong>Webhook URL:</strong><br />
            <code className="text-xs">
              {typeof window !== 'undefined' 
                ? `${window.location.origin}/api/line/webhook`
                : 'https://your-domain.com/api/line/webhook'}
            </code>
          </p>
          <p className="text-xs text-blue-600 mt-2">
            このURLをLINE Developers ConsoleのWebhook URLに設定してください
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded ${
          result.success
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {result.success ? (
            <p className="font-semibold">設定を保存しました</p>
          ) : (
            <div>
              <p className="font-semibold">保存失敗</p>
              <p className="mt-2">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



