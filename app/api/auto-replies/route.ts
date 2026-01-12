import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAutoReplies, createAutoReply } from '@/lib/auto-reply/manager'

/**
 * 自動返信一覧取得API
 * GET /api/auto-replies
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const autoReplies = await getAutoReplies(user.id)

    return NextResponse.json({ autoReplies })
  } catch (error) {
    console.error('Failed to get auto replies:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * 自動返信作成API
 * POST /api/auto-replies
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { keyword, reply_type, reply_text, reply_json, is_active, priority, match_type } = body

    if (!keyword || !reply_type) {
      return NextResponse.json(
        { error: 'keyword and reply_type are required' },
        { status: 400 }
      )
    }

    const autoReply = await createAutoReply(user.id, {
      keyword,
      reply_type,
      reply_text,
      reply_json,
      is_active,
      priority,
      match_type,
    })

    return NextResponse.json({ success: true, autoReply })
  } catch (error) {
    console.error('Failed to create auto reply:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}




