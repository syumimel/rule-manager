import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('認証チェック結果:', { user: user?.id, authError })

    if (authError || !user) {
      console.error('認証エラー:', authError)
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    console.log('FormData取得開始')
    const formData = await request.formData()
    console.log('FormData取得成功')
    
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const ruleId = formData.get('ruleId') as string | null

    console.log('FormData内容:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size,
      name,
      ruleId 
    })

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: '画像名が指定されていません' }, { status: 400 })
    }

    // ファイルサイズチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズが10MBを超えています' },
        { status: 400 }
      )
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '対応していないファイル形式です（JPEG、PNG、GIFのみ）' },
        { status: 400 }
      )
    }

    // ファイル名を生成
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const filePath = `fortune-images/${fileName}`

    console.log('Storageアップロード開始:', { filePath, fileSize: file.size, fileType: file.type })

    // Service Role Keyを使用してStorageにアップロード（RLSをバイパス）
    const adminClient = createAdminClient()
    
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('fortune-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    console.log('Storageアップロード結果:', { uploadData, uploadError })

    if (uploadError) {
      console.error('Storageアップロードエラー:', uploadError)
      return NextResponse.json(
        { error: `アップロードに失敗しました: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 公開URLを取得
    const { data: urlData } = adminClient.storage
      .from('fortune-images')
      .getPublicUrl(filePath)

    console.log('公開URL取得:', urlData)

    console.log('画像アップロード開始 - ユーザーID:', user.id)
    
    // ユーザープロファイルの存在確認
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    console.log('ユーザープロファイル確認結果:', { profile, profileError })

    if (profileError || !profile) {
      console.error('ユーザープロファイルが見つかりません:', profileError)
      // アップロードしたファイルを削除
      await adminClient.storage.from('fortune-images').remove([filePath])
      return NextResponse.json(
        { error: 'ユーザープロファイルが見つかりません。管理者に連絡してください。' },
        { status: 500 }
      )
    }

    // データベースに記録
    // Service Role Keyを使用してRLSをバイパス（認証されたユーザーのIDを明示的に使用）
    console.log('Admin client作成成功（既にStorageで使用済み）')
    
    const insertData = {
      fortune_teller_id: user.id,
      rule_id: ruleId || null,
      name,
      file_path: filePath,
      url: urlData.publicUrl,
    }
    console.log('INSERTデータ:', insertData)

    const { data: image, error: dbError } = await adminClient
      .from('images')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('データベースエラー:', dbError)
      console.error('エラー詳細:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      })
      console.error('ユーザーID:', user.id)
      console.error('INSERTデータ:', insertData)
      // アップロードしたファイルを削除
      await adminClient.storage.from('fortune-images').remove([filePath])
      return NextResponse.json(
        { error: `データベースへの保存に失敗しました: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log('画像アップロード成功:', image)

    return NextResponse.json({
      success: true,
      image,
    })
  } catch (error: any) {
    console.error('画像アップロードエラー:', error)
    return NextResponse.json(
      { error: `アップロードに失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}

