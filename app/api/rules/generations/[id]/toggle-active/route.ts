import { createClient } from '@/lib/supabase/server'
import { toggleGenerationActive } from '@/modules/generation/manager'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const generationId = params.id
    const { isActive } = await request.json()

    // 世代がユーザーのものか確認
    const { data: generation, error: genError } = await supabase
      .from('rule_generations')
      .select(`
        id,
        rule_id,
        rules!inner (
          fortune_teller_id
        )
      `)
      .eq('id', generationId)
      .single()

    if (genError || !generation) {
      return NextResponse.json({ error: '世代が見つかりません' }, { status: 404 })
    }

    // rulesは配列として返される可能性があるため、最初の要素を取得
    const rules = Array.isArray(generation.rules) ? generation.rules[0] : generation.rules
    if (!rules || rules.fortune_teller_id !== user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    // 有効化/無効化
    await toggleGenerationActive(generationId, isActive)

    return NextResponse.json({
      success: true,
      isActive,
    })
  } catch (error: any) {
    console.error('有効化/無効化エラー:', error)
    return NextResponse.json(
      { error: `有効化/無効化に失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}



