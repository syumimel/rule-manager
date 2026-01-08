import { createClient } from '@/lib/supabase/server'
import { validateFortuneTypeDefinition } from '@/modules/fortune-type/validator'
import { FortuneTypeDefinition } from '@/modules/fortune-type/types'
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
    const definition = body.definition as FortuneTypeDefinition

    if (!definition) {
      return NextResponse.json({ error: '定義が指定されていません' }, { status: 400 })
    }

    // 検証
    const validation = await validateFortuneTypeDefinition(definition)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: '定義の検証に失敗しました',
          validationErrors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      )
    }

    // 既存の占いタイプをチェック
    const { data: existing } = await supabase
      .from('fortune_types')
      .select('id')
      .eq('fortune_teller_id', user.id)
      .eq('fortune_type_id', definition.fortune_type_id)
      .single()

    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from('fortune_types')
        .update({
          name: definition.name,
          description: definition.description || null,
          category: definition.category || null,
          definition: definition,
          calculation_function_path: definition.calculation_function,
          message_template_id: definition.message_template_id,
          is_active: definition.is_active ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: `更新に失敗しました: ${error.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        fortuneType: data,
        isNew: false,
        warnings: validation.warnings,
      })
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('fortune_types')
        .insert({
          fortune_teller_id: user.id,
          fortune_type_id: definition.fortune_type_id,
          name: definition.name,
          description: definition.description || null,
          category: definition.category || null,
          definition: definition,
          calculation_function_path: definition.calculation_function,
          message_template_id: definition.message_template_id,
          is_active: definition.is_active ?? true,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: `作成に失敗しました: ${error.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        fortuneType: data,
        isNew: true,
        warnings: validation.warnings,
      })
    }
  } catch (error: any) {
    console.error('占いタイプアップロードエラー:', error)
    return NextResponse.json(
      { error: `アップロードに失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}



