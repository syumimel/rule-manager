import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * JSONメッセージ送信API
 * POST /api/chat/messages/send-json
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, messages } = body

    if (!userId || !messages) {
      return NextResponse.json(
        { error: 'userId and messages are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages must be an array' },
        { status: 400 }
      )
    }

    // メッセージ数の制限（LINE APIの制限: 最大5メッセージ）
    if (messages.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 messages allowed' },
        { status: 400 }
      )
    }

    // メッセージ形式の検証
    for (const msg of messages) {
      if (!msg.type) {
        return NextResponse.json(
          { error: 'Each message must have a type field' },
          { status: 400 }
        )
      }
      
      if (msg.type === 'text' && !msg.text) {
        return NextResponse.json(
          { error: 'Text messages must have a text field' },
          { status: 400 }
        )
      }
    }

    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        { error: 'LINE_CHANNEL_ACCESS_TOKEN is not set' },
        { status: 500 }
      )
    }

    // LINE Push APIでメッセージを送信
    const requestBody = {
      to: userId,
      messages: messages.slice(0, 5), // 最大5メッセージ
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `LINE Push API error: ${response.status} ${response.statusText}`,
        errorText
      )

      // エラーログを保存
      const adminClient = createAdminClient()
      try {
        const messageText = messages
          .filter((msg: any) => msg.type === 'text')
          .map((msg: any) => msg.text)
          .join('\n')
        
        if (messageText) {
          await adminClient.from('message_logs').insert({
            line_user_id: userId,
            message_type: 'sent',
            message_text: messageText,
            raw_event_data: {
              type: 'push_json',
              error: errorText || `HTTP ${response.status}`,
              statusCode: response.status,
            },
          })
        }
      } catch (logError) {
        console.error('Failed to save error log:', logError)
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', statusCode: 429 },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: errorText || `HTTP ${response.status}`, statusCode: response.status },
        { status: response.status }
      )
    }

    // 送信成功: ログを保存
    const adminClient = createAdminClient()
    try {
      const messageText = messages
        .filter((msg: any) => msg.type === 'text')
        .map((msg: any) => msg.text)
        .join('\n')
      
      if (messageText) {
        await adminClient.from('message_logs').insert({
          line_user_id: userId,
          message_type: 'sent',
          message_text: messageText,
          raw_event_data: {
            type: 'push_json',
            messages: messages,
          },
        })
      }
    } catch (logError) {
      console.error('Failed to save message log:', logError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send JSON message:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


