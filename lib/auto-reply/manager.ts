import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type ReplyType = 'text' | 'json'
export type MatchType = 'exact' | 'contains' | 'starts_with' | 'ends_with'

export interface AutoReply {
  id: string
  fortune_teller_id: string
  keyword: string
  reply_type: ReplyType
  reply_text: string | null
  reply_json: any[] | null
  is_active: boolean
  priority: number
  match_type: MatchType
  created_at: string
  updated_at: string
}

export interface AutoReplyInput {
  keyword: string
  reply_type: ReplyType
  reply_text?: string | null
  reply_json?: any[] | null
  is_active?: boolean
  priority?: number
  match_type?: MatchType
}

/**
 * 自動返信を取得（占い師ごと）
 */
export async function getAutoReplies(
  fortuneTellerId: string
): Promise<AutoReply[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('auto_replies')
    .select('*')
    .eq('fortune_teller_id', fortuneTellerId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get auto replies: ${error.message}`)
  }

  return (data || []) as AutoReply[]
}

/**
 * 自動返信を作成
 */
export async function createAutoReply(
  fortuneTellerId: string,
  input: AutoReplyInput
): Promise<AutoReply> {
  const supabase = await createClient()

  // バリデーション
  if (input.reply_type === 'text' && !input.reply_text) {
    throw new Error('reply_text is required for text type')
  }

  if (input.reply_type === 'json' && !input.reply_json) {
    throw new Error('reply_json is required for json type')
  }

  const { data, error } = await supabase
    .from('auto_replies')
    .insert({
      fortune_teller_id: fortuneTellerId,
      keyword: input.keyword,
      reply_type: input.reply_type,
      reply_text: input.reply_type === 'text' ? input.reply_text : null,
      reply_json: input.reply_type === 'json' ? input.reply_json : null,
      is_active: input.is_active ?? true,
      priority: input.priority ?? 0,
      match_type: input.match_type || 'contains',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create auto reply: ${error.message}`)
  }

  return data as AutoReply
}

/**
 * 自動返信を更新
 */
export async function updateAutoReply(
  id: string,
  fortuneTellerId: string,
  input: Partial<AutoReplyInput>
): Promise<AutoReply> {
  const supabase = await createClient()

  const updateData: any = {}

  if (input.keyword !== undefined) updateData.keyword = input.keyword
  if (input.reply_type !== undefined) {
    updateData.reply_type = input.reply_type
    // タイプが変わった場合、不要なフィールドをクリア
    if (input.reply_type === 'text') {
      updateData.reply_text = input.reply_text || null
      updateData.reply_json = null
    } else if (input.reply_type === 'json') {
      updateData.reply_json = input.reply_json || null
      updateData.reply_text = null
    }
  }
  if (input.reply_text !== undefined) updateData.reply_text = input.reply_text
  if (input.reply_json !== undefined) updateData.reply_json = input.reply_json
  if (input.is_active !== undefined) updateData.is_active = input.is_active
  if (input.priority !== undefined) updateData.priority = input.priority
  if (input.match_type !== undefined) updateData.match_type = input.match_type

  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('auto_replies')
    .update(updateData)
    .eq('id', id)
    .eq('fortune_teller_id', fortuneTellerId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update auto reply: ${error.message}`)
  }

  return data as AutoReply
}

/**
 * 自動返信を削除
 */
export async function deleteAutoReply(
  id: string,
  fortuneTellerId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('auto_replies')
    .delete()
    .eq('id', id)
    .eq('fortune_teller_id', fortuneTellerId)

  if (error) {
    throw new Error(`Failed to delete auto reply: ${error.message}`)
  }
}

/**
 * メッセージにマッチする自動返信を取得（Webhook用）
 */
export async function findMatchingAutoReply(
  fortuneTellerId: string,
  messageText: string
): Promise<AutoReply | null> {
  const adminClient = createAdminClient()

  // 有効な自動返信を優先順位順に取得
  const { data, error } = await adminClient
    .from('auto_replies')
    .select('*')
    .eq('fortune_teller_id', fortuneTellerId)
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get auto replies:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  // マッチング処理
  for (const autoReply of data) {
    const keyword = autoReply.keyword.toLowerCase()
    const message = messageText.toLowerCase()

    let isMatch = false

    switch (autoReply.match_type) {
      case 'exact':
        isMatch = message === keyword
        break
      case 'contains':
        isMatch = message.includes(keyword)
        break
      case 'starts_with':
        isMatch = message.startsWith(keyword)
        break
      case 'ends_with':
        isMatch = message.endsWith(keyword)
        break
    }

    if (isMatch) {
      return autoReply as AutoReply
    }
  }

  return null
}

