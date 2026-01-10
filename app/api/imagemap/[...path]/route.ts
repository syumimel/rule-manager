import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET_NAME = 'fortune-images'
const STORAGE_PATH_PREFIX = 'imagemap'
const ALLOWED_SIZES = ['240', '300', '460', '700', '1040']

/**
 * イメージマップ画像プロキシAPI
 * GET /api/imagemap/{folder}/{size}
 * HEAD /api/imagemap/{folder}/{size}
 * 
 * LINEが自動的に以下のようにリクエストします：
 * {baseUrl}/1040 → このAPIで処理
 * {baseUrl}/ → デフォルトサイズ（1040px）を返す
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleImageRequest(request, params, false)
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleImageRequest(request, params, true)
}

async function handleImageRequest(
  request: NextRequest,
  params: { path: string[] },
  headOnly: boolean
) {
  try {
    const adminClient = createAdminClient()
    
    // パスを解析: /api/imagemap/rm001/1040 → ['rm001', '1040']
    // または: /api/imagemap/rm001 → ['rm001']
    const pathSegments = params.path
    
    let size: string
    let folder: string

    if (pathSegments.length === 0) {
      // パスが空の場合（通常は発生しないが、念のため）
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    } else if (pathSegments.length === 1) {
      // パスが1セグメントの場合: {baseUrl}/ → デフォルトサイズ（1040px）を返す
      folder = pathSegments[0]
      size = '1040' // デフォルトサイズ
    } else {
      // パスが2セグメント以上の場合: {baseUrl}/{size}
      size = pathSegments[pathSegments.length - 1]
      folder = pathSegments.slice(0, -1).join('/')
    }

    // サイズのバリデーション
    if (!ALLOWED_SIZES.includes(size)) {
      // 無効なサイズの場合、デフォルトサイズを試す
      size = '1040'
    }

    // Supabaseストレージのパス: imagemap/{folder}/{size}.jpg
    const storagePath = `${STORAGE_PATH_PREFIX}/${folder}/${size}.jpg`

    // Supabaseから画像を取得
    const { data, error } = await adminClient.storage
      .from(BUCKET_NAME)
      .download(storagePath)

    if (error || !data) {
      console.error('Storage error:', error, 'Path:', storagePath)
      return NextResponse.json(
        { error: `Image not found: ${storagePath}` },
        { status: 404 }
      )
    }

    // 画像をBufferに変換
    const buffer = await data.arrayBuffer()
    
    // 画像であることを確認（最初の数バイトでJPEGのマジックナンバーをチェック）
    const uint8Array = new Uint8Array(buffer)
    const isJpeg = uint8Array.length >= 2 && uint8Array[0] === 0xFF && uint8Array[1] === 0xD8
    
    if (!isJpeg && !headOnly) {
      console.error('Invalid image format:', storagePath)
      // HTMLやテキストが返されている可能性がある場合でも、強制的に画像として返す
    }

    // HEADリクエストの場合は、メタデータのみ返す
    if (headOnly) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': buffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          // LINEが要求する可能性のあるヘッダー
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
    
    // 画像をレスポンスとして返す
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // 1年間キャッシュ
        // LINEが要求する可能性のあるヘッダー
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        // ngrokの警告ページ回避のため（クライアント側で設定できないが、念のため）
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (error) {
    console.error('Imagemap proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

