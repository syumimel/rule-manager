import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface Thread {
  lineUserId: string
  lastMessage: string
  lastMessageType: string
  lastMessageAt: string
}

/**
 * スレッド一覧取得API
 * GET /api/chat/threads
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // メッセージログから各LINEユーザーIDごとの最新メッセージを取得
    const { data, error } = await supabase
      .from('message_logs')
      .select('line_user_id, created_at, message_text, message_type')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // スレッドごとにグループ化（最新メッセージのみ）
    const threadsMap = new Map<string, Thread>()
    for (const log of data || []) {
      if (!threadsMap.has(log.line_user_id)) {
        threadsMap.set(log.line_user_id, {
          lineUserId: log.line_user_id,
          lastMessage: log.message_text,
          lastMessageType: log.message_type,
          lastMessageAt: log.created_at,
        })
      }
    }

    const threads = Array.from(threadsMap.values())

    // 作成日時でソート（最新順）
    threads.sort((a, b) => {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })

    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Failed to get threads:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


