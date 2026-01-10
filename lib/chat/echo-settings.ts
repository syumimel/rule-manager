import { createClient } from '@/lib/supabase/server'

export interface ChatSettings {
  id: string
  fortune_teller_id: string
  line_user_id: string
  echo_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * オウム返し設定を取得
 */
export async function getChatSettings(
  fortuneTellerId: string,
  lineUserId: string
): Promise<ChatSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chat_settings')
    .select('*')
    .eq('fortune_teller_id', fortuneTellerId)
    .eq('line_user_id', lineUserId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get chat settings: ${error.message}`)
  }

  return data as ChatSettings
}

/**
 * オウム返し設定を取得（存在しない場合は作成）
 */
export async function getOrCreateChatSettings(
  fortuneTellerId: string,
  lineUserId: string
): Promise<ChatSettings> {
  const supabase = await createClient()

  // 既存の設定を取得
  let settings = await getChatSettings(fortuneTellerId, lineUserId)

  // 存在しない場合は作成
  if (!settings) {
    const { data, error } = await supabase
      .from('chat_settings')
      .insert({
        fortune_teller_id: fortuneTellerId,
        line_user_id: lineUserId,
        echo_enabled: false,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create chat settings: ${error.message}`)
    }

    settings = data as ChatSettings
  }

  return settings
}

/**
 * オウム返し設定を更新
 */
export async function updateChatSettings(
  fortuneTellerId: string,
  lineUserId: string,
  echoEnabled: boolean
): Promise<ChatSettings> {
  const supabase = await createClient()

  // 設定が存在しない場合は作成
  await getOrCreateChatSettings(fortuneTellerId, lineUserId)

  const { data, error } = await supabase
    .from('chat_settings')
    .update({
      echo_enabled: echoEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('fortune_teller_id', fortuneTellerId)
    .eq('line_user_id', lineUserId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update chat settings: ${error.message}`)
  }

  return data as ChatSettings
}

/**
 * ユーザーがオウム返しを有効にしているかチェック
 */
export async function isEchoEnabled(
  fortuneTellerId: string,
  lineUserId: string
): Promise<boolean> {
  const settings = await getChatSettings(fortuneTellerId, lineUserId)
  return settings?.echo_enabled || false
}

