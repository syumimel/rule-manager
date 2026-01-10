import { createAdminClient } from '@/lib/supabase/admin'
import sharp from 'sharp'

const BUCKET_NAME = 'fortune-images' // 既存のバケットを使用
const STORAGE_PATH_PREFIX = 'imagemap'
const ALLOWED_SIZES = [240, 300, 460, 700, 1040] as const

export type ImagemapSize = typeof ALLOWED_SIZES[number]

/**
 * イメージマップ用画像を複数サイズでアップロード
 */
export async function uploadImagemapImages(
  imageFile: File | Buffer,
  folderId: string,
  originalWidth: number = 1040,
  originalHeight: number = 1040
): Promise<{ success: boolean; urls: Record<ImagemapSize, string>; error?: string }> {
  try {
    const adminClient = createAdminClient()
    
    // Fileオブジェクトの場合はBufferに変換
    let imageBuffer: Buffer
    if (imageFile instanceof File) {
      const arrayBuffer = await imageFile.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    } else {
      imageBuffer = imageFile
    }

    // 元画像のメタデータを取得
    const metadata = await sharp(imageBuffer).metadata()
    const imageWidth = originalWidth || metadata.width || 1040
    const imageHeight = originalHeight || metadata.height || 1040

    // アスペクト比を計算
    const aspectRatio = imageHeight / imageWidth

    const urls: Partial<Record<ImagemapSize, string>> = {}

    // 各サイズの画像を生成してアップロード
    for (const width of ALLOWED_SIZES) {
      // アスペクト比を維持して高さを計算
      const height = Math.round(width * aspectRatio)

      // 画像をリサイズ
      const resizedBuffer = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // 白背景
        })
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer()

      // Supabaseストレージのパス
      const storagePath = `${STORAGE_PATH_PREFIX}/${folderId}/${width}.jpg`

      // アップロード
      const { error: uploadError } = await adminClient.storage
        .from(BUCKET_NAME)
        .upload(storagePath, resizedBuffer, {
          contentType: 'image/jpeg',
          upsert: true, // 既存の場合は上書き
        })

      if (uploadError) {
        console.error(`Failed to upload ${width}:`, uploadError)
        return {
          success: false,
          urls: {} as Record<ImagemapSize, string>,
          error: `Failed to upload ${width}px image: ${uploadError.message}`,
        }
      }

      urls[width] = storagePath
    }

    return {
      success: true,
      urls: urls as Record<ImagemapSize, string>,
    }
  } catch (error) {
    console.error('Failed to upload imagemap images:', error)
    return {
      success: false,
      urls: {} as Record<ImagemapSize, string>,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * イメージマップ用画像を削除
 */
export async function deleteImagemapImages(
  folderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()

    // 削除するファイルパスのリスト
    const filePaths = ALLOWED_SIZES.map(
      (size) => `${STORAGE_PATH_PREFIX}/${folderId}/${size}.jpg`
    )

    // 一括削除
    const { error } = await adminClient.storage
      .from(BUCKET_NAME)
      .remove(filePaths)

    if (error) {
      console.error('Failed to delete imagemap images:', error)
      return {
        success: false,
        error: `Failed to delete images: ${error.message}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to delete imagemap images:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 許可されるサイズのリストを取得
 */
export function getAllowedSizes(): readonly ImagemapSize[] {
  return ALLOWED_SIZES
}

