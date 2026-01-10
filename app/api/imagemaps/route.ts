import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getImagemaps, createImagemap } from '@/lib/imagemap/manager'

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
 * イメージマップ一覧取得API
 * GET /api/imagemaps
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const imagemaps = await getImagemaps(user.id)

    return NextResponse.json({ imagemaps })
  } catch (error) {
    console.error('Failed to get imagemaps:', error)
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
 * イメージマップ作成API
 * POST /api/imagemaps
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

    const body = await request.json()
    const { folder_id, name, alt_text, base_width, base_height, actions, video, is_active } = body

    if (!folder_id || !name || !alt_text) {
      return NextResponse.json(
        { error: 'folder_id, name, and alt_text are required' },
        { status: 400 }
      )
    }

    // baseUrlを生成（リクエストからホストを取得）
    const baseUrl = generateBaseUrl(folder_id, request)
    
    // データベースに保存
    const { data: imagemapData, error: insertError } = await supabase
      .from('imagemaps')
      .insert({
        fortune_teller_id: user.id,
        folder_id,
        name,
        base_url: baseUrl,
        alt_text,
        base_width: base_width || 1040,
        base_height: base_height || 1040,
        actions: actions || [],
        video: video || null,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create imagemap: ${insertError.message}` },
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
    console.error('Failed to create imagemap:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

