import { NextRequest, NextResponse } from 'next/server'
import { verifyLineSignature, LineWebhookRequest } from '@/modules/line/webhook'
import { executeFortune, sendReplyMessage, getChannelAccessToken } from '@/modules/line/reply'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLineInteraction } from '@/modules/log/line'
import { saveReceivedMessage, saveSentMessage } from '@/lib/chat/message-log'
import { findMatchingAutoReply } from '@/lib/auto-reply/manager'
import { processILEMessages } from '@/lib/ile/engine'

export async function POST(
  request: NextRequest,
  { params }: { params: { webhook_id: string } }
) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature') || ''
    const webhookId = params.webhook_id

    // Webhook IDからLINE設定を取得
    const adminClient = createAdminClient()
    console.log('[Webhook] Looking up webhook_id:', webhookId)
    const { data: lineSetting, error: settingError } = await adminClient
      .from('line_settings')
      .select('fortune_teller_id, channel_secret')
      .eq('webhook_id', webhookId)
      .single()

    if (settingError || !lineSetting) {
      console.error('[Webhook] Webhook IDが見つかりません:', webhookId, settingError)
      return NextResponse.json({ error: 'Webhook IDが見つかりません' }, { status: 404 })
    }

    console.log('[Webhook] Found line setting for fortune_teller_id:', lineSetting.fortune_teller_id)

    // 署名検証
    if (!verifyLineSignature(body, signature, lineSetting.channel_secret)) {
      console.error('[Webhook] 署名検証に失敗しました')
      return NextResponse.json({ error: '署名検証失敗' }, { status: 401 })
    }

    console.log('[Webhook] Signature verified successfully')

    const webhookData: LineWebhookRequest = JSON.parse(body)
    console.log('[Webhook] Received', webhookData.events?.length || 0, 'events')

    // イベントを処理
    for (const event of webhookData.events) {
      // メッセージイベントのみ処理
      if (event.type === 'message' && event.message?.type === 'text') {
        console.log('[Webhook] Processing message event:', event.message?.text?.substring(0, 50))
        await handleMessageEvent(event, lineSetting.fortune_teller_id, adminClient)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook処理エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook処理に失敗しました' },
      { status: 500 }
    )
  }
}

async function handleMessageEvent(
  event: any,
  fortuneTellerId: string,
  adminClient: any
) {
  const supabase = await createClient()
  const userId = event.source.userId
  const messageText = event.message?.text || ''
  const replyToken = event.replyToken
  const messageId = event.message?.id

  if (!userId || !replyToken) {
    return
  }

  // メッセージログに保存（受信）
  // Webhookは認証なしで実行されるため、adminClientを使用してRLSをバイパス
  try {
    // 重複チェック（messageIdがある場合）
    if (messageId) {
      const { data: existing } = await adminClient
        .from('message_logs')
        .select('id')
        .eq('message_id', messageId)
        .limit(1)
        .single()
      
      if (existing) {
        // 重複メッセージの場合は無視
        console.log('Duplicate message_id, skipping:', messageId)
      } else {
        // メッセージログを保存
        const { error: insertError } = await adminClient
          .from('message_logs')
          .insert({
            line_user_id: userId,
            message_type: 'received',
            message_text: messageText,
            raw_event_data: event,
            reply_token: replyToken || null,
            message_id: messageId || null,
            fortune_teller_id: fortuneTellerId,
          })
        
        if (insertError) {
          console.error('Failed to save message log:', insertError)
        }
      }
    } else {
      // messageIdがない場合は保存を試行
      const { error: insertError } = await adminClient
        .from('message_logs')
        .insert({
          line_user_id: userId,
          message_type: 'received',
          message_text: messageText,
          raw_event_data: event,
          reply_token: replyToken || null,
          message_id: null,
          fortune_teller_id: fortuneTellerId,
        })
      
      if (insertError) {
        console.error('Failed to save message log:', insertError)
      }
    }
  } catch (error: any) {
    console.error('Failed to save message log:', error)
  }

  // 既存のログ記録（line_interactionsテーブル用）
  await logLineInteraction({
    userId,
    eventType: 'message',
    messageContent: messageText,
    replyContent: null,
  })

  // オウム返し設定を確認（adminClientを使用してRLSをバイパス）
  if (fortuneTellerId) {
    console.log('[Webhook] Processing message for fortune_teller_id:', fortuneTellerId)
    console.log('[Webhook] Message text:', messageText)
    
    // adminClientを使って直接chat_settingsを確認
    const { data: chatSettings, error: settingsError } = await adminClient
      .from('chat_settings')
      .select('echo_enabled')
      .eq('fortune_teller_id', fortuneTellerId)
      .eq('line_user_id', userId)
      .single()
    
    const echoEnabled = chatSettings?.echo_enabled || false
    console.log('[Webhook] Echo enabled:', echoEnabled)
    
    if (echoEnabled) {
      // Channel Access Tokenを取得（adminClientを使用）
      const { data: lineSettingForToken } = await adminClient
        .from('line_settings')
        .select('channel_access_token')
        .eq('fortune_teller_id', fortuneTellerId)
        .single()
      
      const accessToken = lineSettingForToken?.channel_access_token || ''
      
      if (!accessToken) {
        console.error('[Webhook] Channel Access Token not found for echo reply')
      }
      
      // オウム返しを実行
      const echoResult = await sendReplyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: messageText,
          },
        ],
        accessToken
      )
      
      // 送信ログを保存（オウム返し、エラー時も保存）
      // Webhookは認証なしで実行されるため、adminClientを使用してRLSをバイパス
      try {
        const { error: insertError } = await adminClient
          .from('message_logs')
          .insert({
            line_user_id: userId,
            message_type: 'sent',
            message_text: messageText,
            raw_event_data: {
              type: 'echo',
              originalMessage: messageText,
              echoEnabled: true,
              success: echoResult.success,
              error: echoResult.error || null,
            },
            formatted_payload: echoResult.success ? {
              replyToken,
              messages: [{ type: 'text', text: messageText }],
            } : null,
            fortune_teller_id: fortuneTellerId,
          })
        
        if (insertError) {
          console.error('Failed to save echo message log:', insertError)
        }
      } catch (error) {
        console.error('Failed to save echo message log:', error)
      }
      
      return // オウム返しの場合は占い処理はスキップ
    }

    // 自動返信をチェック
    console.log('[Webhook] Checking for auto reply...')
    const autoReply = await findMatchingAutoReply(fortuneTellerId, messageText)
    console.log('[Webhook] Auto reply result:', autoReply ? `Found: ${autoReply.keyword} (${autoReply.match_type})` : 'Not found')
    
    if (autoReply) {
      console.log('[Webhook] Executing auto reply:', autoReply.id)
      // Channel Access Tokenを取得（adminClientを使用）
      const { data: lineSettingForToken } = await adminClient
        .from('line_settings')
        .select('channel_access_token')
        .eq('fortune_teller_id', fortuneTellerId)
        .single()
      
      const accessToken = lineSettingForToken?.channel_access_token || ''
      console.log('[Webhook] Access token retrieved:', accessToken ? 'Yes (length: ' + accessToken.length + ')' : 'No')
      
      if (!accessToken) {
        console.error('[Webhook] Channel Access Token not found for fortune_teller_id:', fortuneTellerId)
      }
      
      // 自動返信を実行
      if (autoReply.reply_type === 'text' && autoReply.reply_text) {
        // テキスト返信
        const textResult = await sendReplyMessage(
          replyToken,
          [
            {
              type: 'text',
              text: autoReply.reply_text,
            },
          ],
          accessToken
        )

        // 送信ログを保存（エラー時も保存）
        try {
          await adminClient.from('message_logs').insert({
            line_user_id: userId,
            message_type: 'sent',
            message_text: autoReply.reply_text,
            fortune_teller_id: fortuneTellerId,
            raw_event_data: {
              type: 'auto_reply',
              auto_reply_id: autoReply.id,
              keyword: autoReply.keyword,
              match_type: autoReply.match_type,
              success: textResult.success,
              error: textResult.error || null,
            },
            formatted_payload: textResult.success ? {
              replyToken,
              messages: [{ type: 'text', text: autoReply.reply_text }],
            } : null,
          })
        } catch (error) {
          console.error('Failed to save auto reply message log:', error)
        }
      } else if (autoReply.reply_type === 'json' && autoReply.reply_json) {
        // JSON返信（ILEエンジンで処理）
        let processedMessages: any[] = []
        let ileError: string | null = null
        
        try {
          processedMessages = await processILEMessages(
            autoReply.reply_json,
            fortuneTellerId
          )
        } catch (error: any) {
          console.error('ILE processing error:', error)
          ileError = error.message || 'ILE処理エラー'
          // エラー時は元のメッセージを使用
          processedMessages = autoReply.reply_json
        }

        const jsonResult = await sendReplyMessage(
          replyToken,
          processedMessages,
          accessToken
        )

        // 送信ログを保存（エラー時も保存）
        try {
          const replyText = processedMessages
            .filter((msg: any) => msg.type === 'text')
            .map((msg: any) => msg.text)
            .join('\n')
          
          await adminClient.from('message_logs').insert({
            line_user_id: userId,
            message_type: 'sent',
            message_text: replyText || '(JSONメッセージ)',
            fortune_teller_id: fortuneTellerId,
            raw_event_data: {
              type: 'auto_reply',
              auto_reply_id: autoReply.id,
              keyword: autoReply.keyword,
              match_type: autoReply.match_type,
              messages: processedMessages,
              original_messages: autoReply.reply_json,
              ile_error: ileError,
              success: jsonResult.success && !ileError,
              error: jsonResult.error || ileError || null,
            },
            formatted_payload: jsonResult.success ? {
              replyToken,
              messages: processedMessages,
            } : null,
          })
        } catch (error) {
          console.error('Failed to save auto reply message log:', error)
        }
      }
      
      return // 自動返信の場合は占い処理はスキップ
    }
  }

  // 占い実行（簡易版: メッセージが「占い」で始まる場合）
  if (messageText.startsWith('占い') || messageText.startsWith('うらない')) {
    // デフォルトの占いタイプとルールを使用（実際の実装では、ユーザーごとの設定から取得）
    const defaultFortuneTypeId = 'numerology'
    const defaultRuleGenerationId = await getDefaultRuleGenerationId(supabase)

    // Channel Access Tokenを取得（adminClientを使用）
    const { data: lineSettingForToken } = await adminClient
      .from('line_settings')
      .select('channel_access_token')
      .eq('fortune_teller_id', fortuneTellerId)
      .single()
    
    const accessTokenForFortune = lineSettingForToken?.channel_access_token || ''

    if (!defaultRuleGenerationId) {
      const noRuleResult = await sendReplyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: '占いルールが設定されていません。管理画面でルールをアップロードしてください。',
          },
        ],
        accessTokenForFortune
      )
      
      // エラーログを保存
      try {
        await adminClient.from('message_logs').insert({
          line_user_id: userId,
          message_type: 'sent',
          message_text: '占いルールが設定されていません。管理画面でルールをアップロードしてください。',
          fortune_teller_id: fortuneTellerId,
          raw_event_data: {
            type: 'fortune_no_rule',
            success: noRuleResult.success,
            error: noRuleResult.error || null,
          },
          formatted_payload: noRuleResult.success ? {
            replyToken,
            messages: [{ type: 'text', text: '占いルールが設定されていません。管理画面でルールをアップロードしてください。' }],
          } : null,
        })
      } catch (error) {
        console.error('Failed to save no rule message log:', error)
      }
      
      return
    }

    // 生年月日を抽出（簡易版: YYYYMMDD形式を想定）
    const birthDateMatch = messageText.match(/(\d{8})/)
    const birthDate = birthDateMatch ? birthDateMatch[1] : null

    if (!birthDate) {
      const noBirthDateResult = await sendReplyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: '生年月日を入力してください。\n形式: YYYYMMDD（例: 19900101）',
          },
        ],
        accessTokenForFortune
      )
      
      // エラーログを保存
      try {
        await adminClient.from('message_logs').insert({
          line_user_id: userId,
          message_type: 'sent',
          message_text: '生年月日を入力してください。\n形式: YYYYMMDD（例: 19900101）',
          fortune_teller_id: fortuneTellerId,
          raw_event_data: {
            type: 'fortune_no_birthdate',
            success: noBirthDateResult.success,
            error: noBirthDateResult.error || null,
          },
          formatted_payload: noBirthDateResult.success ? {
            replyToken,
            messages: [{ type: 'text', text: '生年月日を入力してください。\n形式: YYYYMMDD（例: 19900101）' }],
          } : null,
        })
      } catch (error) {
        console.error('Failed to save no birthdate message log:', error)
      }
      
      return
    }

    // 占いを実行
    const fortuneResult = await executeFortune(
      defaultFortuneTypeId,
      userId, // 実際の実装では、占い師のIDを取得
      { birth_date: birthDate },
      defaultRuleGenerationId
    )

    if (fortuneResult.success && fortuneResult.messages) {
      // 返信を送信
      const replyResult = await sendReplyMessage(
        replyToken,
        fortuneResult.messages,
        accessTokenForFortune
      )

      // メッセージログに保存（送信、エラー時も保存）
      // Webhookは認証なしで実行されるため、adminClientを使用してRLSをバイパス
      try {
        const replyText = fortuneResult.messages
          .filter((msg: any) => msg.type === 'text')
          .map((msg: any) => msg.text)
          .join('\n')
        
        const { error: insertError } = await adminClient
          .from('message_logs')
          .insert({
            line_user_id: userId,
            message_type: 'sent',
            message_text: replyText || '(JSONメッセージ)',
            fortune_teller_id: fortuneTellerId,
            raw_event_data: {
              type: 'fortune',
              messages: fortuneResult.messages,
              fortuneType: defaultFortuneTypeId,
              resultValue: fortuneResult.resultValue,
              success: replyResult.success,
              error: replyResult.error || null,
            },
            formatted_payload: replyResult.success ? {
              replyToken,
              messages: fortuneResult.messages,
            } : null,
          })
        
        if (insertError) {
          console.error('Failed to save sent message log:', insertError)
        }
      } catch (error) {
        console.error('Failed to save sent message log:', error)
      }

      // ログ記録（返信）- 既存のline_interactionsテーブル用
      await logLineInteraction({
        userId,
        eventType: 'message',
        messageContent: messageText,
        replyContent: fortuneResult.messages,
        fortuneType: defaultFortuneTypeId,
        resultValue: fortuneResult.resultValue,
      })
    } else {
      // エラーメッセージを返信
      const errorResult = await sendReplyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: fortuneResult.error || '占いの実行に失敗しました',
          },
        ],
        accessTokenForFortune
      )

      // エラーメッセージ送信ログを保存
      try {
        await adminClient.from('message_logs').insert({
          line_user_id: userId,
          message_type: 'sent',
          message_text: fortuneResult.error || '占いの実行に失敗しました',
          fortune_teller_id: fortuneTellerId,
          raw_event_data: {
            type: 'fortune_error',
            fortuneType: defaultFortuneTypeId,
            error: fortuneResult.error,
            success: errorResult.success,
            send_error: errorResult.error || null,
          },
          formatted_payload: errorResult.success ? {
            replyToken,
            messages: [{ type: 'text', text: fortuneResult.error || '占いの実行に失敗しました' }],
          } : null,
        })
      } catch (error) {
        console.error('Failed to save error message log:', error)
      }
    }
  } else {
    // その他のメッセージにはデフォルト返信
    const defaultReplyText = '占いを開始するには「占い YYYYMMDD」と入力してください。\n例: 占い 19900101'
    
    // Channel Access Tokenを取得（adminClientを使用）
    const { data: lineSettingForToken } = await adminClient
      .from('line_settings')
      .select('channel_access_token')
      .eq('fortune_teller_id', fortuneTellerId)
      .single()
    
    const accessTokenForDefault = lineSettingForToken?.channel_access_token || ''
    
    const defaultResult = await sendReplyMessage(
      replyToken,
      [
        {
          type: 'text',
          text: defaultReplyText,
        },
      ],
      accessTokenForDefault
    )
    
    // 送信ログを保存（エラー時も保存）
    try {
      const { error: insertError } = await adminClient
        .from('message_logs')
        .insert({
          line_user_id: userId,
          message_type: 'sent',
          message_text: defaultReplyText,
          fortune_teller_id: fortuneTellerId,
          raw_event_data: {
            type: 'default_reply',
            success: defaultResult.success,
            error: defaultResult.error || null,
          },
          formatted_payload: defaultResult.success ? {
            replyToken,
            messages: [{ type: 'text', text: defaultReplyText }],
          } : null,
        })
      
      if (insertError) {
        console.error('Failed to save default reply message log:', insertError)
      }
    } catch (error) {
      console.error('Failed to save default reply message log:', error)
    }
  }
}

async function getDefaultRuleGenerationId(supabase: any): Promise<string | null> {
  // 有効な世代を1つ取得（簡易版）
  const { data: generation } = await supabase
    .from('rule_generations')
    .select('id')
    .eq('is_active', true)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .single()

  return generation?.id || null
}

