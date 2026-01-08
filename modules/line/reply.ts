import { createClient } from '@/lib/supabase/server'
import { getCompiledMessage } from '@/modules/fortune-type/compiler'
import { callCalculationFunction, getFortuneTypeDefinition } from '@/modules/fortune/calculator'
import { FortuneTypeDefinition } from '@/modules/fortune-type/types'

export interface LineReplyMessage {
  type: 'text' | 'image' | 'imagemap'
  text?: string
  originalContentUrl?: string
  previewImageUrl?: string
  baseUrl?: string
  altText?: string
  width?: number
  height?: number
  actions?: any[]
}

/**
 * 占いを実行して返信メッセージを取得
 */
export async function executeFortune(
  fortuneTypeId: string,
  userId: string,
  inputData: Record<string, any>,
  ruleGenerationId?: string
): Promise<{
  success: boolean
  messages?: LineReplyMessage[]
  error?: string
  resultValue?: number
}> {
  try {
    const supabase = await createClient()

    // 占いタイプ定義を取得
    const fortuneTypeDef = await getFortuneTypeDefinition(fortuneTypeId, userId)

    if (!fortuneTypeDef) {
      return {
        success: false,
        error: '占いタイプが見つかりません',
      }
    }

    // 有効なルール世代を取得
    if (!ruleGenerationId) {
      // 占いタイプに関連するルールを取得（簡易版）
      // 実際の実装では、占いタイプとルールの紐付けが必要
      return {
        success: false,
        error: 'ルール世代が指定されていません',
      }
    }

    // 計算関数を呼び出し
    const calculationResult = await callCalculationFunction(
      fortuneTypeDef.calculation_function,
      {
        fortune_type_id: fortuneTypeId,
        input_data: inputData,
        rule_generation_id: ruleGenerationId,
      }
    )

    // 事前コンパイル済みメッセージを取得
    const compiledMessage = await getCompiledMessage(
      fortuneTypeDef.message_template_id,
      calculationResult.result_value
    )

    if (!compiledMessage) {
      return {
        success: false,
        error: `result_value ${calculationResult.result_value}に対応するメッセージが見つかりません`,
      }
    }

    // メッセージをLINE形式に変換
    const messages = await convertToLineMessages(compiledMessage.messages, supabase)

    return {
      success: true,
      messages,
      resultValue: calculationResult.result_value,
    }
  } catch (error: any) {
    console.error('占い実行エラー:', error)
    return {
      success: false,
      error: error.message || '占いの実行に失敗しました',
    }
  }
}

/**
 * コンパイル済みメッセージをLINE形式に変換
 */
async function convertToLineMessages(
  messages: any[],
  supabase: any
): Promise<LineReplyMessage[]> {
  const lineMessages: LineReplyMessage[] = []

  for (const msg of messages) {
    if (msg.type === 'text') {
      lineMessages.push({
        type: 'text',
        text: msg.content.text,
      })
    } else if (msg.type === 'image') {
      // 画像IDからURLを取得
      if (msg.content.image_id) {
        const { data: image } = await supabase
          .from('images')
          .select('url')
          .eq('id', msg.content.image_id)
          .single()

        if (image) {
          lineMessages.push({
            type: 'image',
            originalContentUrl: image.url,
            previewImageUrl: image.url,
          })
        }
      }
    } else if (msg.type === 'imagemap') {
      // イメージマップメッセージ
      lineMessages.push({
        type: 'imagemap',
        baseUrl: msg.content.base_url,
        altText: msg.content.alt_text || 'イメージマップ',
        width: msg.content.width || 1040,
        height: msg.content.height || 1040,
        actions: msg.content.actions || [],
      })
    }
  }

  return lineMessages
}

/**
 * LINE Reply APIを呼び出し
 */
export async function sendReplyMessage(
  replyToken: string,
  messages: LineReplyMessage[],
  channelAccessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: channelAccessToken.startsWith('Bearer ') 
          ? channelAccessToken 
          : `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: messages.slice(0, 5), // LINE APIの制限: 最大5メッセージ
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LINE API エラー: ${response.status} ${errorText}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('LINE返信エラー:', error)
    return {
      success: false,
      error: error.message || '返信に失敗しました',
    }
  }
}

/**
 * Channel Access Tokenを取得
 */
export async function getChannelAccessToken(
  fortuneTellerId: string
): Promise<string | null> {
  const supabase = await createClient()

  // LINE設定からChannel Secretを取得（実際の実装では、Channel Access Tokenを取得する必要がある）
  // ここでは簡易版として、Channel Secretを返す
  const { data: lineSettings } = await supabase
    .from('line_settings')
    .select('channel_secret')
    .eq('fortune_teller_id', fortuneTellerId)
    .single()

  // 実際の実装では、Channel Access Tokenを取得するAPIを呼び出す必要がある
  // ここでは簡易版として、環境変数から取得
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || null
}

