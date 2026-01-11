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

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { imageIds } = body as { imageIds: string[] }

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: '削除する画像IDが指定されていません' }, { status: 400 })
    }

    // ユーザープロファイルの存在確認
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'ユーザープロファイルが見つかりません' },
        { status: 500 }
      )
    }

    // 削除対象の画像を取得して権限確認
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, file_path, fortune_teller_id')
      .in('id', imageIds)

    if (imagesError || !images) {
      return NextResponse.json(
        { error: '画像の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 全ての画像が自分のものか確認（管理者以外）
    if (profile.role !== 'admin') {
      const unauthorizedImages = images.filter(img => img.fortune_teller_id !== user.id)
      if (unauthorizedImages.length > 0) {
        return NextResponse.json(
          { error: '削除権限のない画像が含まれています' },
          { status: 403 }
        )
      }
    }

    // Service Role Keyを使用してStorageから削除
    const adminClient = createAdminClient()
    const filePaths = images.map(img => img.file_path)
    
    const { error: storageError } = await adminClient.storage
      .from('fortune-images')
      .remove(filePaths)

    if (storageError) {
      console.error('Storage削除エラー:', storageError)
      // Storage削除が失敗してもDB削除は続行
    }

    // データベースから削除
    const { error: dbError } = await adminClient
      .from('images')
      .delete()
      .in('id', imageIds)

    if (dbError) {
      console.error('データベース削除エラー:', dbError)
      return NextResponse.json(
        { error: `削除に失敗しました: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: imageIds.length,
    })
  } catch (error: any) {
    console.error('画像削除エラー:', error)
    return NextResponse.json(
      { error: `削除に失敗しました: ${error.message}` },
      { status: 500 }
    )
  }
}


