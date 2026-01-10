import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getChatSettings, updateChatSettings } from '@/lib/chat/echo-settings'

/**
 * オウム返し設定取得API
 * GET /api/chat/echo-settings?lineUserId=xxx
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

    const searchParams = request.nextUrl.searchParams
    const lineUserId = searchParams.get('lineUserId')

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'lineUserId is required' },
        { status: 400 }
      )
    }

    const settings = await getChatSettings(user.id, lineUserId)

    return NextResponse.json({
      echoEnabled: settings?.echo_enabled || false,
      settings: settings || null,
    })
  } catch (error) {
    console.error('Failed to get echo settings:', error)
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
 * オウム返し設定更新API
 * POST /api/chat/echo-settings
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { lineUserId, echoEnabled } = body

    if (!lineUserId || typeof echoEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'lineUserId and echoEnabled (boolean) are required' },
        { status: 400 }
      )
    }

    const settings = await updateChatSettings(user.id, lineUserId, echoEnabled)

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Failed to update echo settings:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

