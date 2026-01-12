/**
 * LINE Push APIを呼び出してメッセージを送信
 */
export async function pushMessage(
  userId: string,
  messageText: string,
  fortuneTellerId?: string
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    // fortuneTellerIdが指定されている場合はデータベースから取得
    let accessToken: string | null = null
    if (fortuneTellerId) {
      const { getChannelAccessToken } = await import('@/modules/line/reply')
      accessToken = await getChannelAccessToken(fortuneTellerId)
    }
    
    // データベースから取得できない場合は環境変数から取得
    if (!accessToken) {
      accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || null
    }
    
    if (!accessToken) {
      return {
        success: false,
        error: 'LINE_CHANNEL_ACCESS_TOKEN is not set',
        statusCode: 500,
      }
    }

    const requestBody = {
      to: userId,
      messages: [
        {
          type: 'text',
          text: messageText,
        },
      ],
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `LINE Push API error: ${response.status} ${response.statusText}`,
        errorText
      )

      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          statusCode: 429,
        }
      }

      return {
        success: false,
        error: errorText || `HTTP ${response.status}`,
        statusCode: response.status,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('LINE Push API request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}




