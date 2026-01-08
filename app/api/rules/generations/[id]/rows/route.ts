import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

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

    if (generation.rules.fortune_teller_id !== user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    // 行データを取得
    const { data: rows, error: rowsError } = await supabase
      .from('rule_rows')
      .select('id, row_number, data')
      .eq('generation_id', generationId)
      .order('row_number', { ascending: true })
      .range(offset, offset + limit - 1)

    if (rowsError) {
      return NextResponse.json(
        { error: `データの取得に失敗しました: ${rowsError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rows: rows || [],
    })
  } catch (error: any) {
    console.error('データ取得エラー:', error)
    return NextResponse.json(
      { error: `データの取得に失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}



