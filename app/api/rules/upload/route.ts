import { createClient } from '@/lib/supabase/server'
import { parseCSV, validateCSV, convertToJSON } from '@/modules/csv-import/validator'
import { manageGenerations, getNextGenerationNumber, deleteOldestGeneration } from '@/modules/generation/manager'
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const ruleName = formData.get('ruleName') as string
    const category = formData.get('category') as string | null

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    if (!ruleName) {
      return NextResponse.json({ error: 'ルール名が指定されていません' }, { status: 400 })
    }

    // CSVファイルを読み込む
    const csvText = await file.text()

    // CSVをパース
    const { headers, rows } = parseCSV(csvText)

    // 検証
    const validation = validateCSV(rows, headers)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'CSVの検証に失敗しました',
          validationErrors: validation.errors,
        },
        { status: 400 }
      )
    }

    // ルールを取得または作成
    let ruleId: string

    // 既存のルールを検索
    const { data: existingRule } = await supabase
      .from('rules')
      .select('id')
      .eq('name', ruleName)
      .eq('fortune_teller_id', user.id)
      .single()

    if (existingRule) {
      ruleId = existingRule.id
    } else {
      // 新規作成
      const { data: newRule, error: ruleError } = await supabase
        .from('rules')
        .insert({
          name: ruleName,
          category: category || null,
          fortune_teller_id: user.id,
        })
        .select('id')
        .single()

      if (ruleError || !newRule) {
        return NextResponse.json(
          { error: `ルールの作成に失敗しました: ${ruleError?.message}` },
          { status: 500 }
        )
      }

      ruleId = newRule.id
    }

    // 世代管理
    const generationManagement = await manageGenerations(ruleId, user.id)

    // 古い世代を削除
    if (generationManagement.shouldDeleteOldest && generationManagement.oldestGenerationId) {
      await deleteOldestGeneration(ruleId, generationManagement.oldestGenerationId)
    }

    // 次の世代番号を取得
    const generationNumber = await getNextGenerationNumber(ruleId)

    // 世代を作成
    const { data: generation, error: generationError } = await supabase
      .from('rule_generations')
      .insert({
        rule_id: ruleId,
        generation_number: generationNumber,
        uploaded_by: user.id,
        row_count: rows.length,
        is_active: true,
      })
      .select('id')
      .single()

    if (generationError || !generation) {
      return NextResponse.json(
        { error: `世代の作成に失敗しました: ${generationError?.message}` },
        { status: 500 }
      )
    }

    // CSV行をJSONに変換
    const jsonRows = convertToJSON(headers, rows)

    // バッチで保存（1000行ずつ）
    const batchSize = 1000
    for (let i = 0; i < jsonRows.length; i += batchSize) {
      const batch = jsonRows.slice(i, i + batchSize)
      const rowsToInsert = batch.map((row) => ({
        generation_id: generation.id,
        row_number: row.rowNumber,
        data: row.data,
      }))

      const { error: insertError } = await supabase
        .from('rule_rows')
        .insert(rowsToInsert)

      if (insertError) {
        return NextResponse.json(
          { error: `データの保存に失敗しました: ${insertError.message}` },
          { status: 500 }
        )
      }
    }

    // プレビュー（先頭10行）
    const preview = jsonRows.slice(0, 10)

    return NextResponse.json({
      success: true,
      ruleId,
      generationId: generation.id,
      rowCount: rows.length,
      preview,
    })
  } catch (error: any) {
    console.error('CSVアップロードエラー:', error)
    return NextResponse.json(
      { error: `アップロードに失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}



