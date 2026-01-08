import crypto from 'crypto'

/**
 * LINE Webhookの署名を検証
 */
export function verifyLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  if (!signature) {
    return false
  }

  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64')

  return hash === signature
}

/**
 * LINE Webhookイベントの型定義
 */
export interface LineWebhookEvent {
  type: string
  timestamp: number
  source: {
    type: string
    userId?: string
    groupId?: string
    roomId?: string
  }
  message?: {
    id: string
    type: string
    text?: string
  }
  replyToken?: string
}

export interface LineWebhookRequest {
  events: LineWebhookEvent[]
}



