import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getImagemap, deleteImagemap } from '@/lib/imagemap/manager'

// baseUrlを生成するヘルパー関数
function generateBaseUrl(folderId: string, request: NextRequest): string {
  // Vercelの場合
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/imagemap/${folderId}`
  }
  
  // リクエストからホストを取得
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (host?.includes('localhost') ? 'http' : 'https')
  
  if (host) {
    return `${protocol}://${host}/api/imagemap/${folderId}`
  }
  
  // NEXT_PUBLIC_APP_URLが設定されている場合
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL)
      return `${url.origin}/api/imagemap/${folderId}`
    } catch {
      return `${process.env.NEXT_PUBLIC_APP_URL}/api/imagemap/${folderId}`
    }
  }
  
  // デフォルト（開発環境）
  return `http://localhost:3000/api/imagemap/${folderId}`
}

/**
 * イメージマップ詳細取得API
 * GET /api/imagemaps/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const imagemap = await getImagemap(params.id, user.id)

    if (!imagemap) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ imagemap })
  } catch (error) {
    console.error('Failed to get imagemap:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * イメージマップ更新API
 * PUT /api/imagemaps/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { folder_id, name, alt_text, base_width, base_height, actions, video, is_active } = body

    // baseUrlを生成（folder_idが変わった場合）
    const updateData: any = {}
    
    if (folder_id !== undefined) {
      updateData.folder_id = folder_id
      updateData.base_url = generateBaseUrl(folder_id, request)
    }
    if (name !== undefined) updateData.name = name
    if (alt_text !== undefined) updateData.alt_text = alt_text
    if (base_width !== undefined) updateData.base_width = base_width
    if (base_height !== undefined) updateData.base_height = base_height
    if (actions !== undefined) updateData.actions = actions
    if (video !== undefined) updateData.video = video
    if (is_active !== undefined) updateData.is_active = is_active
    updateData.updated_at = new Date().toISOString()

    const { data: imagemapData, error: updateError } = await supabase
      .from('imagemaps')
      .update(updateData)
      .eq('id', params.id)
      .eq('fortune_teller_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update imagemap: ${updateError.message}` },
        { status: 500 }
      )
    }

    const imagemap = {
      ...imagemapData,
      actions: imagemapData.actions || [],
      video: imagemapData.video || null,
    }

    return NextResponse.json({ success: true, imagemap })
  } catch (error) {
    console.error('Failed to update imagemap:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * イメージマップ削除API
 * DELETE /api/imagemaps/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    await deleteImagemap(params.id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete imagemap:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

