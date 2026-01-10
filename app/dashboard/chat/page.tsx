'use client'

import { useEffect, useState, useRef } from 'react'
import { MessageLog } from '@/lib/chat/message-log'
import { maskUserId, formatDateTime } from '@/lib/chat/utils'
import { createClient } from '@/lib/supabase/client'

interface Thread {
  lineUserId: string
  lastMessage: string
  lastMessageType: string
  lastMessageAt: string
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageLog[]>([])
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [echoEnabled, setEchoEnabled] = useState<Record<string, boolean>>({})
  const [loadingEcho, setLoadingEcho] = useState<Record<string, boolean>>({})
  const [jsonInput, setJsonInput] = useState('')
  const [sendingJson, setSendingJson] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // スレッド一覧を取得
  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/chat/threads')
      if (!response.ok) throw new Error('Failed to fetch threads')
      const data = await response.json()
      setThreads(data.threads || [])
      
      // 各スレッドのオウム返し設定を取得
      const echoStates: Record<string, boolean> = {}
      for (const thread of data.threads || []) {
        try {
          const echoResponse = await fetch(
            `/api/chat/echo-settings?lineUserId=${encodeURIComponent(thread.lineUserId)}`
          )
          if (echoResponse.ok) {
            const echoData = await echoResponse.json()
            echoStates[thread.lineUserId] = echoData.echoEnabled || false
          }
        } catch (error) {
          console.error('Failed to fetch echo settings:', error)
        }
      }
      setEchoEnabled(echoStates)
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
    }
  }

  // メッセージ一覧を取得
  const fetchMessages = async (userId: string, merge: boolean = false) => {
    try {
      const response = await fetch(`/api/chat/threads/${encodeURIComponent(userId)}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      const newMessages = data.messages || []
      
      if (merge) {
        // 既存のメッセージとマージ（重複を避ける）
        setMessages((prev) => {
          const messageMap = new Map<string, MessageLog>()
          prev.forEach((msg) => {
            messageMap.set(msg.id, msg)
          })
          newMessages.forEach((msg: MessageLog) => {
            if (!messageMap.has(msg.id)) {
              messageMap.set(msg.id, msg)
            }
          })
          return Array.from(messageMap.values()).sort((a, b) => {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          })
        })
      } else {
        setMessages(newMessages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // スレッド選択時の処理
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread)
      // オウム返し設定を取得
      fetch(`/api/chat/echo-settings?lineUserId=${encodeURIComponent(selectedThread)}`)
        .then(res => res.json())
        .then(data => {
          setEchoEnabled(prev => ({
            ...prev,
            [selectedThread]: data.echoEnabled || false,
          }))
        })
        .catch(err => console.error('Failed to fetch echo settings:', err))
    } else {
      setMessages([])
    }
  }, [selectedThread])

  // 初回読み込み
  useEffect(() => {
    fetchThreads()
  }, [])

  // Realtime購読
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client is not initialized')
      return
    }

    const channel = supabase
      .channel('message_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_logs',
        },
        (payload) => {
          console.log('Realtime event received:', payload)
          const newMessage = payload.new as MessageLog

          // 選択中のスレッドのメッセージの場合、追加
          if (selectedThread === newMessage.line_user_id) {
            console.log('Adding new message to UI:', newMessage)
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === newMessage.id)
              if (exists) {
                console.log('Message already exists, skipping:', newMessage.id)
                return prev
              }
              return [...prev, newMessage]
            })
          }

          // スレッド一覧を更新
          fetchThreads()
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscription active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error')
        }
      })

    return () => {
      if (supabase) {
        console.log('Cleaning up Realtime subscription')
        supabase.removeChannel(channel)
      }
    }
  }, [selectedThread, supabase])

  // メッセージ送信
  const handleSend = async () => {
    if (!selectedThread || !messageText.trim() || sending) return

    const textToSend = messageText.trim()
    
    try {
      setSending(true)
      const response = await fetch('/api/chat/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedThread,
          messageText: textToSend,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`送信失敗: ${error.error || 'Unknown error'}`)
        return
      }

      // 送信成功: 入力欄をクリア
      setMessageText('')
      
      // メッセージ一覧を再取得
      setTimeout(async () => {
        await fetchMessages(selectedThread, true)
      }, 500)
    } catch (error: any) {
      console.error('Failed to send message:', error)
      alert('メッセージの送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  // JSONメッセージ送信
  const handleSendJson = async () => {
    if (!selectedThread || !jsonInput.trim() || sendingJson) return

    try {
      setSendingJson(true)
      setJsonError(null)

      // JSONをパースして検証
      let parsedMessages: any[]
      try {
        parsedMessages = JSON.parse(jsonInput.trim())
      } catch (parseError) {
        setJsonError('JSON形式が正しくありません')
        return
      }

      if (!Array.isArray(parsedMessages)) {
        setJsonError('メッセージは配列形式である必要があります')
        return
      }

      if (parsedMessages.length === 0) {
        setJsonError('メッセージが空です')
        return
      }

      if (parsedMessages.length > 5) {
        setJsonError('メッセージは最大5件までです')
        return
      }

      // LINE APIで送信
      const response = await fetch('/api/chat/messages/send-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedThread,
          messages: parsedMessages,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setJsonError(error.error || '送信に失敗しました')
        return
      }

      // 送信成功: 入力欄をクリア
      setJsonInput('')
      setJsonError(null)
      
      // メッセージ一覧を再取得
      setTimeout(async () => {
        await fetchMessages(selectedThread, true)
      }, 500)
    } catch (error: any) {
      console.error('Failed to send JSON message:', error)
      setJsonError('メッセージの送信に失敗しました')
    } finally {
      setSendingJson(false)
    }
  }

  // オウム返し設定の切り替え
  const handleToggleEcho = async (lineUserId: string, currentValue: boolean) => {
    setLoadingEcho(prev => ({ ...prev, [lineUserId]: true }))
    
    try {
      const response = await fetch('/api/chat/echo-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId,
          echoEnabled: !currentValue,
        }),
      })

      if (response.ok) {
        setEchoEnabled(prev => ({
          ...prev,
          [lineUserId]: !currentValue,
        }))
      } else {
        alert('オウム返し設定の更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to toggle echo:', error)
      alert('オウム返し設定の更新に失敗しました')
    } finally {
      setLoadingEcho(prev => ({ ...prev, [lineUserId]: false }))
    }
  }

  // スクロールを最下部に
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <main className="flex h-[calc(100vh-12rem)]">
      {/* 左サイドバー: スレッド一覧 */}
      <div className="w-80 border-r border-gray-300 bg-gray-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-300">
          <h2 className="text-lg font-bold mb-2">友達一覧</h2>
          <p className="text-xs text-gray-600">メッセージを送受信したユーザー</p>
        </div>
        {loading ? (
          <div className="p-4 text-center text-gray-500">読み込み中...</div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            スレッドがありません
          </div>
        ) : (
          <div>
            {threads.map((thread) => (
              <div
                key={thread.lineUserId}
                className={`border-b border-gray-200 hover:bg-gray-100 ${
                  selectedThread === thread.lineUserId ? 'bg-blue-50' : ''
                }`}
              >
                <button
                  onClick={() => setSelectedThread(thread.lineUserId)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-mono text-sm">
                      {maskUserId(thread.lineUserId)}
                    </div>
                    <label
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-gray-600">オウム返し</span>
                      <input
                        type="checkbox"
                        checked={echoEnabled[thread.lineUserId] || false}
                        onChange={() => handleToggleEcho(thread.lineUserId, echoEnabled[thread.lineUserId] || false)}
                        disabled={loadingEcho[thread.lineUserId]}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {formatDateTime(thread.lastMessageAt)}
                  </div>
                  <div className="text-sm text-gray-700 truncate">
                    {thread.lastMessage}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* メインエリア: メッセージ表示 */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* メッセージ表示エリア */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  メッセージがありません
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.message_type === 'sent'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-md rounded-lg p-3 ${
                          message.message_type === 'sent'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="text-sm mb-1 opacity-80">
                          {formatDateTime(message.created_at)}
                        </div>
                        <div>{message.message_text}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* メッセージ送信フォーム */}
            <div className="border-t border-gray-300 p-4 bg-gray-50 space-y-4">
              {/* 通常のメッセージ送信フォーム */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                  maxLength={5000}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                  className={`px-6 py-2 rounded ${
                    !messageText.trim() || sending
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {sending ? '送信中...' : '送信'}
                </button>
              </form>

              {/* JSON送信フォーム */}
              <div className="border-t border-gray-300 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSONメッセージ送信
                </label>
                <div className="space-y-2">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value)
                      setJsonError(null)
                    }}
                    placeholder={`例:\n[\n  {\n    "type": "text",\n    "text": "こんにちは\\nよろしく"\n  },\n  {\n    "type": "text",\n    "text": "お願いします。"\n  }\n]`}
                    className="w-full px-4 py-2 border border-gray-300 rounded font-mono text-sm"
                    rows={8}
                    style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                  {jsonError && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
                      {jsonError}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      LINE Messaging API形式のJSONを入力（最大5メッセージ）
                    </div>
                    <button
                      onClick={handleSendJson}
                      disabled={!jsonInput.trim() || sendingJson}
                      className={`px-6 py-2 rounded ${
                        !jsonInput.trim() || sendingJson
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {sendingJson ? '送信中...' : 'JSON送信'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">スレッドを選択してください</p>
              <p className="text-sm">左側の友達一覧から選択</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

