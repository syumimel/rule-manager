import { NextRequest, NextResponse } from 'next/server'
import { getMessageLogsByUser } from '@/lib/chat/message-log'

/**
 * 特定スレッドのメッセージ取得API
 * GET /api/chat/threads/[userId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const messages = await getMessageLogsByUser(params.userId, 100, 0)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to get thread messages:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

