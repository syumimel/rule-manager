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

    // 画像フォーマットを検出（拡張子なしなので、複数の拡張子を試す）
    const possibleExtensions = ['png', 'jpg', 'webp']
    let storagePath: string | null = null
    let imageData: Blob | null = null
    let imageError: any = null
    let contentType = 'image/jpeg' // デフォルト

    // 各拡張子を試す
    for (const ext of possibleExtensions) {
      const testPath = `${STORAGE_PATH_PREFIX}/${folder}/${size}.${ext}`
      const { data, error } = await adminClient.storage
        .from(BUCKET_NAME)
        .download(testPath)

      if (!error && data) {
        storagePath = testPath
        imageData = data
        // Content-Typeを拡張子から決定
        contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
        break
      }
      imageError = error
    }

    if (!imageData || !storagePath) {
      console.error('Storage error:', imageError, 'Tried paths:', possibleExtensions.map(ext => `${STORAGE_PATH_PREFIX}/${folder}/${size}.${ext}`))
      return NextResponse.json(
        { error: `Image not found: ${STORAGE_PATH_PREFIX}/${folder}/${size}` },
        { status: 404 }
      )
    }

    // 画像をBufferに変換
    const buffer = await imageData.arrayBuffer()
    
    // 画像であることを確認（マジックナンバーをチェック）
    const uint8Array = new Uint8Array(buffer)
    const isJpeg = uint8Array.length >= 2 && uint8Array[0] === 0xFF && uint8Array[1] === 0xD8
    const isPng = uint8Array.length >= 8 && 
                  uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
                  uint8Array[2] === 0x4E && uint8Array[3] === 0x47
    const isWebp = uint8Array.length >= 12 &&
                   uint8Array[0] === 0x52 && uint8Array[1] === 0x49 &&
                   uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
                   uint8Array[8] === 0x57 && uint8Array[9] === 0x45 &&
                   uint8Array[10] === 0x42 && uint8Array[11] === 0x50

    // 実際のフォーマットに基づいてContent-Typeを設定
    if (isPng) {
      contentType = 'image/png'
    } else if (isWebp) {
      contentType = 'image/webp'
    } else if (isJpeg) {
      contentType = 'image/jpeg'
    }

    // HEADリクエストの場合は、メタデータのみ返す
    if (headOnly) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': contentType,
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
        'Content-Type': contentType,
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

