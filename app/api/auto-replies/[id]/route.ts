import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateAutoReply, deleteAutoReply } from '@/lib/auto-reply/manager'

/**
 * 自動返信更新API
 * PUT /api/auto-replies/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const autoReply = await updateAutoReply(params.id, user.id, {
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
    console.error('Failed to update auto reply:', error)
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
 * 自動返信削除API
 * DELETE /api/auto-replies/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    await deleteAutoReply(params.id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete auto reply:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

