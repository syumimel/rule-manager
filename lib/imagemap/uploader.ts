import { createAdminClient } from '@/lib/supabase/admin'
import sharp from 'sharp'

const BUCKET_NAME = 'fortune-images' // 既存のバケットを使用
const STORAGE_PATH_PREFIX = 'imagemap'
const ALLOWED_SIZES = [240, 300, 460, 700, 1040] as const

export type ImagemapSize = typeof ALLOWED_SIZES[number]

/**
 * 画像フォーマットを検出して適切な拡張子とMIMEタイプを返す
 */
async function detectImageFormat(buffer: Buffer, fileName?: string): Promise<{
  format: 'jpeg' | 'png' | 'webp'
  extension: string
  mimeType: string
  hasAlpha: boolean
}> {
  // sharpでメタデータを取得してフォーマットを検出
  const metadata = await sharp(buffer).metadata()
  const format = metadata.format || 'jpeg'
  const hasAlpha = metadata.hasAlpha || false

  // ファイル名から拡張子を取得（フォールバック）
  const fileNameLower = fileName?.toLowerCase() || ''

  if (format === 'png' || fileNameLower.endsWith('.png')) {
    return {
      format: 'png',
      extension: 'png',
      mimeType: 'image/png',
      hasAlpha: hasAlpha || true, // PNGの場合は透過を維持
    }
  } else if (format === 'webp' || fileNameLower.endsWith('.webp')) {
    return {
      format: 'webp',
      extension: 'webp',
      mimeType: 'image/webp',
      hasAlpha: hasAlpha,
    }
  } else {
    // JPEGまたは不明な場合
    return {
      format: 'jpeg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      hasAlpha: false,
    }
  }
}

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
    let fileName: string | undefined
    if (imageFile instanceof File) {
      const arrayBuffer = await imageFile.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
      fileName = imageFile.name
    } else {
      imageBuffer = imageFile
    }

    // 画像フォーマットを検出
    const imageInfo = await detectImageFormat(imageBuffer, fileName)
    
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

      // 画像をリサイズ（透過型の場合は透過を維持）
      let resizedBuffer: Buffer
      let sharpInstance = sharp(imageBuffer).resize(width, height, {
        fit: 'contain',
      })

      if (imageInfo.hasAlpha && imageInfo.format === 'png') {
        // PNGの場合は透過を維持（背景を追加しない）
        resizedBuffer = await sharpInstance
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer()
      } else if (imageInfo.hasAlpha && imageInfo.format === 'webp') {
        // WebPの場合は透過を維持
        resizedBuffer = await sharpInstance
          .webp({ quality: 90 })
          .toBuffer()
      } else {
        // JPEGの場合は白背景を追加
        resizedBuffer = await sharpInstance
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer()
      }

      const storagePath = `${STORAGE_PATH_PREFIX}/${folderId}/${width}.${imageInfo.extension}`

      // アップロード
      const { error: uploadError } = await adminClient.storage
        .from(BUCKET_NAME)
        .upload(storagePath, resizedBuffer, {
          contentType: imageInfo.mimeType,
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

    // 削除するファイルパスのリスト（複数の拡張子に対応）
    const filePaths: string[] = []
    const extensions = ['jpg', 'png', 'webp']
    
    for (const size of ALLOWED_SIZES) {
      for (const ext of extensions) {
        filePaths.push(`${STORAGE_PATH_PREFIX}/${folderId}/${size}.${ext}`)
      }
    }

    // 一括削除（存在しないファイルのエラーは無視）
    const { error } = await adminClient.storage
      .from(BUCKET_NAME)
      .remove(filePaths)

    if (error) {
      console.error('Failed to delete imagemap images:', error)
      // 一部のファイルが存在しない場合はエラーとしない
      if (!error.message.includes('not found')) {
        return {
          success: false,
          error: `Failed to delete images: ${error.message}`,
        }
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
