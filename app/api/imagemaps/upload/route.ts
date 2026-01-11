import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { uploadImagemapImages } from '@/lib/imagemap/uploader'

/**
 * イメージマップ画像アップロードAPI
 * POST /api/imagemaps/upload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const folderId = formData.get('folder_id') as string
    const width = formData.get('width') ? parseInt(formData.get('width') as string) : 1040
    const height = formData.get('height') ? parseInt(formData.get('height') as string) : 1040

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      )
    }

    if (!folderId) {
      return NextResponse.json(
        { error: 'folder_id is required' },
        { status: 400 }
      )
    }

    // ファイルタイプのチェック
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // 画像をアップロードして複数サイズを生成
    const result = await uploadImagemapImages(
      imageFile,
      folderId,
      width,
      height
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload images' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      urls: result.urls,
      message: 'Images uploaded successfully',
    })
  } catch (error) {
    console.error('Failed to upload imagemap images:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


