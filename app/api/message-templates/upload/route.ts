import { createClient } from '@/lib/supabase/server'
import { validateMessageTemplate } from '@/modules/fortune-type/validator'
import { compileMessageTemplate as compileTemplate } from '@/modules/fortune-type/compiler'
import { MessageTemplateDefinition } from '@/modules/fortune-type/types'
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
    const template = body.template as MessageTemplateDefinition
    const fortuneTypeId = body.fortune_type_id as string | undefined

    if (!template) {
      return NextResponse.json({ error: 'テンプレートが指定されていません' }, { status: 400 })
    }

    // 占いタイプの確認
    if (fortuneTypeId) {
      const { data: fortuneType } = await supabase
        .from('fortune_types')
        .select('id, fortune_type_id')
        .eq('fortune_teller_id', user.id)
        .eq('fortune_type_id', fortuneTypeId)
        .single()

      if (!fortuneType) {
        return NextResponse.json(
          { error: '指定された占いタイプが見つかりません' },
          { status: 404 }
        )
      }
    }

    // 検証
    const validation = await validateMessageTemplate(template, fortuneTypeId)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'テンプレートの検証に失敗しました',
          validationErrors: validation.errors,
          warnings: validation.warnings,
          missingValues: validation.missingValues,
          invalidMessageCounts: validation.invalidMessageCounts,
          missingImages: validation.missingImages,
        },
        { status: 400 }
      )
    }

    // 既存のテンプレートをチェック
    const { data: existing } = await supabase
      .from('fortune_message_templates')
      .select('id')
      .eq('template_id', template.template_id)
      .single()

    const templateData = {
      template_id: template.template_id,
      fortune_type_id: template.fortune_type_id,
      name: template.name,
      description: template.description || null,
      template_config: template,
      validation_result: validation,
      is_validated: false, // コンパイル後にtrueになる
    }

    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from('fortune_message_templates')
        .update({
          ...templateData,
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

      // 事前コンパイル
      const compileResult = await compileTemplate(template.template_id, template)

      return NextResponse.json({
        success: true,
        template: data,
        isNew: false,
        warnings: validation.warnings,
        compiled: compileResult.success,
        compiledCount: compileResult.compiledCount,
      })
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('fortune_message_templates')
        .insert(templateData)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: `作成に失敗しました: ${error.message}` },
          { status: 500 }
        )
      }

      // 事前コンパイル
      const compileResult = await compileTemplate(template.template_id, template)

      return NextResponse.json({
        success: true,
        template: data,
        isNew: true,
        warnings: validation.warnings,
        compiled: compileResult.success,
        compiledCount: compileResult.compiledCount,
        compileError: compileResult.error,
      })
    }
  } catch (error: any) {
    console.error('メッセージテンプレートアップロードエラー:', error)
    return NextResponse.json(
      { error: `アップロードに失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}



