import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
    const { channel_id, channel_secret } = body

    if (!channel_id || !channel_secret) {
      return NextResponse.json(
        { error: 'Channel IDとChannel Secretが必要です' },
        { status: 400 }
      )
    }

    // 既存の設定をチェック
    const { data: existing } = await supabase
      .from('line_settings')
      .select('id')
      .eq('fortune_teller_id', user.id)
      .single()

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('line_settings')
        .update({
          channel_id,
          channel_secret,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json(
          { error: `更新に失敗しました: ${error.message}` },
          { status: 500 }
        )
      }
    } else {
      // 新規作成
      const { error } = await supabase
        .from('line_settings')
        .insert({
          fortune_teller_id: user.id,
          channel_id,
          channel_secret,
        })

      if (error) {
        return NextResponse.json(
          { error: `作成に失敗しました: ${error.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('LINE設定保存エラー:', error)
    return NextResponse.json(
      { error: `設定の保存に失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}



