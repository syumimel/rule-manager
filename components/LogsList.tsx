'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Log {
  id: string
  line_user_id: string
  message_type: 'received' | 'sent'
  message_text: string
  raw_event_data: any
  formatted_payload?: any | null
  reply_token?: string | null
  message_id?: string | null
  created_at: string
}

interface LogsListProps {
  logs: Log[]
  currentPage: number
  totalPages: number
}

export default function LogsList({ logs, currentPage, totalPages }: LogsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/dashboard/logs?${params.toString()}`)
  }

  const handleLogClick = (log: Log) => {
    setSelectedLog(log)
  }

  const closeModal = () => {
    setSelectedLog(null)
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        ログがありません
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザーID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  種別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メッセージ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => {
                const isError = log.raw_event_data?.error || log.raw_event_data?.type === 'error'
                const hasJsonData = log.formatted_payload || 
                  (log.raw_event_data?.messages) || 
                  (log.raw_event_data?.type && log.raw_event_data.type !== 'error')
                
                return (
                  <tr 
                    key={log.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${isError ? 'bg-red-50' : ''}`}
                    onClick={() => handleLogClick(log)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.line_user_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.message_type === 'sent' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {log.message_type === 'sent' ? '送信' : '受信'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.message_text || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isError ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          エラー
                        </span>
                      ) : hasJsonData ? (
                        <span className="text-blue-600 hover:text-blue-800">
                          JSON詳細を見る →
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <span className="text-sm text-gray-700">
              ページ {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        )}
      </div>

      {/* JSON詳細モーダル */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                ログ詳細
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">基本情報</h3>
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">日時:</span>{' '}
                        {new Date(selectedLog.created_at).toLocaleString('ja-JP')}
                      </div>
                      <div>
                        <span className="font-medium">種別:</span>{' '}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedLog.message_type === 'sent' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedLog.message_type === 'sent' ? '送信' : '受信'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">ユーザーID:</span>{' '}
                        {selectedLog.line_user_id}
                      </div>
                      {selectedLog.message_id && (
                        <div>
                          <span className="font-medium">メッセージID:</span>{' '}
                          {selectedLog.message_id}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">メッセージテキスト</h3>
                  <div className="bg-gray-50 rounded p-3 text-sm whitespace-pre-wrap">
                    {selectedLog.message_text || '-'}
                  </div>
                </div>

                {selectedLog.formatted_payload && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">送信JSON (formatted_payload)</h3>
                    <pre className="bg-gray-900 text-green-400 rounded p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.formatted_payload, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.raw_event_data?.messages && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">送信メッセージ配列</h3>
                    <pre className="bg-gray-900 text-green-400 rounded p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.raw_event_data.messages, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.raw_event_data?.original_messages && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">元のメッセージ (ILE処理前)</h3>
                    <pre className="bg-gray-900 text-yellow-400 rounded p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.raw_event_data.original_messages, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.raw_event_data?.error && (
                  <div>
                    <h3 className="text-sm font-medium text-red-700 mb-2">エラー情報</h3>
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                      {typeof selectedLog.raw_event_data.error === 'string' 
                        ? selectedLog.raw_event_data.error
                        : JSON.stringify(selectedLog.raw_event_data.error, null, 2)}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">生データ (raw_event_data)</h3>
                  <pre className="bg-gray-900 text-gray-300 rounded p-4 text-xs overflow-x-auto max-h-96">
                    {JSON.stringify(selectedLog.raw_event_data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



