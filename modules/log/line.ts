import { createClient } from '@/lib/supabase/server'

export interface LineInteractionLog {
  userId: string
  eventType: string
  messageContent?: string | null
  replyContent?: any | null
  fortuneType?: string | null
  ruleId?: string | null
  generationId?: string | null
  resultValue?: number | null
}

/**
 * LINEやり取りログを記録
 */
export async function logLineInteraction(log: LineInteractionLog): Promise<void> {
  const supabase = await createClient()

  await supabase.from('line_interactions').insert({
    user_id: log.userId,
    event_type: log.eventType,
    message_content: log.messageContent || null,
    reply_content: log.replyContent || null,
    fortune_type: log.fortuneType || null,
    rule_id: log.ruleId || null,
    generation_id: log.generationId || null,
    result_value: log.resultValue || null,
  })
}



