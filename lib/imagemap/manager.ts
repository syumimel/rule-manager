import { createClient } from '@/lib/supabase/server'
import { Imagemap, ImagemapInput, ImagemapLineMessage } from './types'

/**
 * イメージマップ一覧を取得
 */
export async function getImagemaps(
  fortuneTellerId: string
): Promise<Imagemap[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('imagemaps')
    .select('*')
    .eq('fortune_teller_id', fortuneTellerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get imagemaps: ${error.message}`)
  }

  return (data || []).map((item) => ({
    ...item,
    actions: item.actions || [],
    video: item.video || null,
  })) as Imagemap[]
}

/**
 * イメージマップを取得
 */
export async function getImagemap(
  id: string,
  fortuneTellerId: string
): Promise<Imagemap | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('imagemaps')
    .select('*')
    .eq('id', id)
    .eq('fortune_teller_id', fortuneTellerId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get imagemap: ${error.message}`)
  }

  return {
    ...data,
    actions: data.actions || [],
    video: data.video || null,
  } as Imagemap
}

/**
 * baseUrlを生成
 */
function generateBaseUrl(folderId: string, request?: Request): string {
  // リクエストからホストを取得（サーバーサイドの場合）
  if (request) {
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    if (host) {
      return `${protocol}://${host}/api/imagemap/${folderId}`
    }
  }

  // Vercelの場合
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/imagemap/${folderId}`
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
 * イメージマップを作成
 * @deprecated baseUrlを直接指定する場合は、APIルートで直接INSERTしてください
 */
export async function createImagemap(
  fortuneTellerId: string,
  input: ImagemapInput,
  baseUrl?: string
): Promise<Imagemap> {
  const supabase = await createClient()

  const finalBaseUrl = baseUrl || generateBaseUrl(input.folder_id)

  const { data, error } = await supabase
    .from('imagemaps')
    .insert({
      fortune_teller_id: fortuneTellerId,
      folder_id: input.folder_id,
      name: input.name,
      base_url: finalBaseUrl,
      alt_text: input.alt_text,
      base_width: input.base_width || 1040,
      base_height: input.base_height || 1040,
      actions: input.actions || [],
      video: input.video || null,
      is_active: input.is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create imagemap: ${error.message}`)
  }

  return {
    ...data,
    actions: data.actions || [],
    video: data.video || null,
  } as Imagemap
}

/**
 * イメージマップを更新
 */
export async function updateImagemap(
  id: string,
  fortuneTellerId: string,
  input: Partial<ImagemapInput>
): Promise<Imagemap> {
  const supabase = await createClient()

  const updateData: any = {}

  if (input.folder_id !== undefined) {
    updateData.folder_id = input.folder_id
    // folder_idが変わった場合、baseUrlも更新
    updateData.base_url = generateBaseUrl(input.folder_id)
  }
  if (input.name !== undefined) updateData.name = input.name
  if (input.alt_text !== undefined) updateData.alt_text = input.alt_text
  if (input.base_width !== undefined) updateData.base_width = input.base_width
  if (input.base_height !== undefined) updateData.base_height = input.base_height
  if (input.actions !== undefined) updateData.actions = input.actions
  if (input.video !== undefined) updateData.video = input.video
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('imagemaps')
    .update(updateData)
    .eq('id', id)
    .eq('fortune_teller_id', fortuneTellerId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update imagemap: ${error.message}`)
  }

  return {
    ...data,
    actions: data.actions || [],
    video: data.video || null,
  } as Imagemap
}

/**
 * イメージマップを削除
 */
export async function deleteImagemap(
  id: string,
  fortuneTellerId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('imagemaps')
    .delete()
    .eq('id', id)
    .eq('fortune_teller_id', fortuneTellerId)

  if (error) {
    throw new Error(`Failed to delete imagemap: ${error.message}`)
  }
}

/**
 * イメージマップをLINE Messaging API形式に変換
 */
export function toLineMessage(imagemap: Imagemap): ImagemapLineMessage {
  return {
    type: 'imagemap',
    baseUrl: imagemap.base_url,
    altText: imagemap.alt_text,
    baseSize: {
      width: imagemap.base_width,
      height: imagemap.base_height,
    },
    actions: imagemap.actions,
    ...(imagemap.video && { video: imagemap.video }),
  }
}

