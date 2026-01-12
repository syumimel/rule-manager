import { NextRequest, NextResponse } from 'next/server'
import { pushMessage } from '@/lib/chat/line-push'
import { saveMessageLog } from '@/lib/chat/message-log'
import { createClient } from '@/lib/supabase/server'

/**
 * メッセージ送信API
 * POST /api/chat/messages/send
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

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

    // LINE APIでメッセージを送信（fortune_teller_idを渡す）
    const result = await pushMessage(userId, messageText, user.id)

    if (result.success) {
      // 送信成功: ログを保存
      await saveMessageLog({
        lineUserId: userId,
        messageType: 'sent',
        messageText,
        rawEventData: {
          type: 'push',
          to: userId,
          messages: [
            {
              type: 'text',
              text: messageText,
            },
          ],
        },
        fortuneTellerId: user.id,
      })

      return NextResponse.json({ success: true })
    } else {
      // 送信失敗: エラーログを保存
      await saveMessageLog({
        lineUserId: userId,
        messageType: 'sent',
        messageText,
        rawEventData: {
          type: 'push',
          to: userId,
          error: result.error,
          statusCode: result.statusCode,
        },
        fortuneTellerId: user.id,
      })

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




