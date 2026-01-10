import { NextRequest, NextResponse } from 'next/server'
import { verifyLineSignature, LineWebhookRequest } from '@/modules/line/webhook'
import { executeFortune, sendReplyMessage, getChannelAccessToken } from '@/modules/line/reply'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logLineInteraction } from '@/modules/log/line'
import { saveReceivedMessage, saveSentMessage } from '@/lib/chat/message-log'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature') || ''

    // 環境変数からChannel Secretを取得（実際の実装では、ユーザーごとに取得）
    const channelSecret = process.env.LINE_CHANNEL_SECRET || ''

    if (!channelSecret) {
      console.error('LINE_CHANNEL_SECRETが設定されていません')
      return NextResponse.json({ error: '設定エラー' }, { status: 500 })
    }

    // 署名検証
    if (!verifyLineSignature(body, signature, channelSecret)) {
      console.error('署名検証に失敗しました')
      return NextResponse.json({ error: '署名検証失敗' }, { status: 401 })
    }

    const webhookData: LineWebhookRequest = JSON.parse(body)

    // イベントを処理
    for (const event of webhookData.events) {
      // メッセージイベントのみ処理
      if (event.type === 'message' && event.message?.type === 'text') {
        await handleMessageEvent(event)
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

async function handleMessageEvent(event: any) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
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

  // 占い師IDを取得（LINE設定から、またはデフォルト）
  const fortuneTellerId = await getFortuneTellerId(adminClient)
  
  // オウム返し設定を確認（adminClientを使用してRLSをバイパス）
  if (fortuneTellerId) {
    // adminClientを使って直接chat_settingsを確認
    const { data: chatSettings, error: settingsError } = await adminClient
      .from('chat_settings')
      .select('echo_enabled')
      .eq('fortune_teller_id', fortuneTellerId)
      .eq('line_user_id', userId)
      .single()
    
    const echoEnabled = chatSettings?.echo_enabled || false
    
    if (echoEnabled) {
      // オウム返しを実行
      await sendReplyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: messageText,
          },
        ],
        process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
      )
      
      // 送信ログを保存（オウム返し）
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
            },
          })
        
        if (insertError) {
          console.error('Failed to save echo message log:', insertError)
        }
      } catch (error) {
        console.error('Failed to save echo message log:', error)
      }
      
      return // オウム返しの場合は占い処理はスキップ
    }
  }

  // 占い実行（簡易版: メッセージが「占い」で始まる場合）
  if (messageText.startsWith('占い') || messageText.startsWith('うらない')) {
    // デフォルトの占いタイプとルールを使用（実際の実装では、ユーザーごとの設定から取得）
    const defaultFortuneTypeId = 'numerology'
    const defaultRuleGenerationId = await getDefaultRuleGenerationId(supabase)

    if (!defaultRuleGenerationId) {
      await sendReplyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: '占いルールが設定されていません。管理画面でルールをアップロードしてください。',
          },
        ],
        process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
      )
      return
    }

    // 生年月日を抽出（簡易版: YYYYMMDD形式を想定）
    const birthDateMatch = messageText.match(/(\d{8})/)
    const birthDate = birthDateMatch ? birthDateMatch[1] : null

    if (!birthDate) {
      await sendReplyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: '生年月日を入力してください。\n形式: YYYYMMDD（例: 19900101）',
          },
        ],
        process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
      )
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
        process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
      )

      // メッセージログに保存（送信）
      // Webhookは認証なしで実行されるため、adminClientを使用してRLSをバイパス
      try {
        const replyText = fortuneResult.messages
          .filter((msg: any) => msg.type === 'text')
          .map((msg: any) => msg.text)
          .join('\n')
        
        if (replyText) {
          const { error: insertError } = await adminClient
            .from('message_logs')
            .insert({
              line_user_id: userId,
              message_type: 'sent',
              message_text: replyText,
              raw_event_data: {
                type: 'fortune',
                messages: fortuneResult.messages,
                fortuneType: defaultFortuneTypeId,
                resultValue: fortuneResult.resultValue,
              },
            })
          
          if (insertError) {
            console.error('Failed to save sent message log:', insertError)
          }
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
      await sendReplyMessage(
        replyToken,
        [
          {
            type: 'text',
            text: fortuneResult.error || '占いの実行に失敗しました',
          },
        ],
        process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
      )
    }
  } else {
    // その他のメッセージにはデフォルト返信
    const defaultReplyText = '占いを開始するには「占い YYYYMMDD」と入力してください。\n例: 占い 19900101'
    
    await sendReplyMessage(
      replyToken,
      [
        {
          type: 'text',
          text: defaultReplyText,
        },
      ],
      process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
    )
    
    // 送信ログを保存
    try {
      const { error: insertError } = await adminClient
        .from('message_logs')
        .insert({
          line_user_id: userId,
          message_type: 'sent',
          message_text: defaultReplyText,
          raw_event_data: {
            type: 'default_reply',
          },
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

async function getFortuneTellerId(adminClient: any): Promise<string | null> {
  try {
    // LINE設定から最初の占い師IDを取得（簡易版）
    // 実際の実装では、LINE設定から複数の占い師を管理する必要がある場合がある
    const { data: settings, error } = await adminClient
      .from('line_settings')
      .select('fortune_teller_id')
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get fortune teller ID:', error)
      return null
    }

    if (settings) {
      return settings.fortune_teller_id
    }

    // line_settingsにデータがない場合、user_profilesから最初の占い師IDを取得
    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Failed to get user profile:', profileError)
      return null
    }

    return userProfile?.id || null
  } catch (error) {
    console.error('Failed to get fortune teller ID:', error)
    return null
  }
}



