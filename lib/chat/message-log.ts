import { createClient } from '@/lib/supabase/server'

export type MessageType = 'received' | 'sent'

export interface MessageLogInput {
  lineUserId: string
  messageType: MessageType
  messageText: string
  rawEventData: Record<string, any>
  replyToken?: string
  messageId?: string
  formattedPayload?: Record<string, any>
  fortuneTellerId?: string
}

export interface MessageLog {
  id: string
  line_user_id: string
  message_type: MessageType
  message_text: string
  raw_event_data: Record<string, any>
  reply_token?: string | null
  message_id?: string | null
  formatted_payload?: Record<string, any> | null
  created_at: string
}

/**
 * メッセージIDの重複チェック
 */
export async function checkDuplicateMessageId(
  messageId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('message_logs')
    .select('id')
    .eq('message_id', messageId)
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return false
    }
    throw error
  }

  return data !== null
}

/**
 * メッセージログを保存
 */
export async function saveMessageLog(
  input: MessageLogInput
): Promise<MessageLog> {
  const supabase = await createClient()

  // fortune_teller_idが指定されていない場合は、現在のユーザーIDを取得
  let fortuneTellerId = input.fortuneTellerId
  if (!fortuneTellerId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      fortuneTellerId = user.id
    }
  }

  // 重複チェック
  if (input.messageId) {
    const isDuplicate = await checkDuplicateMessageId(input.messageId)
    if (isDuplicate) {
      throw new Error(`Duplicate message_id: ${input.messageId}`)
    }
  }

  const { data, error } = await supabase
    .from('message_logs')
    .insert({
      line_user_id: input.lineUserId,
      message_type: input.messageType,
      message_text: input.messageText,
      raw_event_data: input.rawEventData,
      reply_token: input.replyToken || null,
      message_id: input.messageId || null,
      formatted_payload: input.formattedPayload || null,
      fortune_teller_id: fortuneTellerId || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save message log: ${error.message}`)
  }

  return data as MessageLog
}

/**
 * 受信メッセージログを保存
 */
export async function saveReceivedMessage(
  lineUserId: string,
  messageText: string,
  rawEventData: Record<string, any>,
  replyToken?: string,
  messageId?: string
): Promise<MessageLog> {
  return saveMessageLog({
    lineUserId,
    messageType: 'received',
    messageText,
    rawEventData,
    replyToken,
    messageId,
  })
}

/**
 * 送信メッセージログを保存
 */
export async function saveSentMessage(
  lineUserId: string,
  messageText: string,
  rawEventData: Record<string, any>
): Promise<MessageLog> {
  return saveMessageLog({
    lineUserId,
    messageType: 'sent',
    messageText,
    rawEventData,
  })
}

/**
 * 特定ユーザーのメッセージログを取得（スレッド表示用）
 */
export async function getMessageLogsByUser(
  lineUserId: string,
  limit: number = 100,
  offset: number = 0
): Promise<MessageLog[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('message_logs')
    .select('*')
    .eq('line_user_id', lineUserId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get message logs by user: ${error.message}`)
  }

  return (data || []) as MessageLog[]
}




