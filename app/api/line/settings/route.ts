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
    const { channel_id, channel_secret, channel_access_token } = body

    if (!channel_id || !channel_secret || !channel_access_token) {
      return NextResponse.json(
        { error: 'Channel ID、Channel Secret、Channel Access Tokenが必要です' },
        { status: 400 }
      )
    }

    // 既存の設定をチェック
    const { data: existing } = await supabase
      .from('line_settings')
      .select('id, webhook_id')
      .eq('fortune_teller_id', user.id)
      .single()

    // webhook_idが存在しない場合は生成
    let webhookId = existing?.webhook_id
    if (!webhookId) {
      // UUIDを生成（crypto.randomUUID()を使用）
      webhookId = crypto.randomUUID()
    }

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('line_settings')
        .update({
          channel_id,
          channel_secret,
          channel_access_token,
          webhook_id: webhookId,
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
      // webhook_idを生成（新規作成時）
      if (!webhookId) {
        webhookId = crypto.randomUUID()
      }
      
      // 新規作成
      const { error } = await supabase
        .from('line_settings')
        .insert({
          fortune_teller_id: user.id,
          channel_id,
          channel_secret,
          channel_access_token,
          webhook_id: webhookId,
        })

      if (error) {
        return NextResponse.json(
          { error: `作成に失敗しました: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // 更新後のwebhook_idを返す
    const { data: updatedSettings } = await supabase
      .from('line_settings')
      .select('webhook_id')
      .eq('fortune_teller_id', user.id)
      .single()

    return NextResponse.json({ 
      success: true,
      webhook_id: updatedSettings?.webhook_id 
    })
  } catch (error: any) {
    console.error('LINE設定保存エラー:', error)
    return NextResponse.json(
      { error: `設定の保存に失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}



