import { NextRequest, NextResponse } from 'next/server'
import { verifyLineSignature, LineWebhookRequest } from '@/modules/line/webhook'
import { executeFortune, sendReplyMessage, getChannelAccessToken } from '@/modules/line/reply'
import { createClient } from '@/lib/supabase/server'
import { logLineInteraction } from '@/modules/log/line'

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
  const userId = event.source.userId
  const messageText = event.message?.text || ''
  const replyToken = event.replyToken

  if (!userId || !replyToken) {
    return
  }

  // ログ記録（受信）
  await logLineInteraction({
    userId,
    eventType: 'message',
    messageContent: messageText,
    replyContent: null,
  })

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

      // ログ記録（返信）
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
    await sendReplyMessage(
      replyToken,
      [
        {
          type: 'text',
          text: '占いを開始するには「占い YYYYMMDD」と入力してください。\n例: 占い 19900101',
        },
      ],
      process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
    )
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



