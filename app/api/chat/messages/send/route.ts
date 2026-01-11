import { NextRequest, NextResponse } from 'next/server'
import { pushMessage } from '@/lib/chat/line-push'
import { saveSentMessage } from '@/lib/chat/message-log'

/**
 * メッセージ送信API
 * POST /api/chat/messages/send
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, messageText } = body

    if (!userId || !messageText) {
      return NextResponse.json(
        { error: 'userId and messageText are required' },
        { status: 400 }
      )
    }

    if (messageText.length > 5000) {
      return NextResponse.json(
        { error: 'Message text must be 5000 characters or less' },
        { status: 400 }
      )
    }

    // LINE APIでメッセージを送信
    const result = await pushMessage(userId, messageText)

    if (result.success) {
      // 送信成功: ログを保存
      await saveSentMessage(userId, messageText, {
        type: 'push',
        to: userId,
        messages: [
          {
            type: 'text',
            text: messageText,
          },
        ],
      } as any)

      return NextResponse.json({ success: true })
    } else {
      // 送信失敗: エラーログを保存
      await saveSentMessage(userId, messageText, {
        type: 'push',
        to: userId,
        error: result.error,
        statusCode: result.statusCode,
      } as any)

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          statusCode: result.statusCode,
        },
        { status: result.statusCode || 500 }
      )
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}



