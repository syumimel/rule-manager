import { createClient } from '@/lib/supabase/server'

const MAX_GENERATIONS = 6

export interface GenerationInfo {
  id: string
  generation_number: number
  uploaded_at: string
  row_count: number
  is_active: boolean
}

/**
 * 新しい世代を作成する前に、古い世代を削除する
 */
export async function manageGenerations(
  ruleId: string,
  userId: string
): Promise<{ shouldDeleteOldest: boolean; oldestGenerationId?: string }> {
  const supabase = await createClient()

  // 既存の世代を取得（世代番号順）
  const { data: generations, error } = await supabase
    .from('rule_generations')
    .select('id, generation_number')
    .eq('rule_id', ruleId)
    .order('generation_number', { ascending: true })

  if (error) {
    throw new Error(`世代の取得に失敗しました: ${error.message}`)
  }

  // 6世代未満の場合は削除不要
  if (!generations || generations.length < MAX_GENERATIONS) {
    return { shouldDeleteOldest: false }
  }

  // 最も古い世代（generation_numberが最小）を削除対象とする
  const oldestGeneration = generations[0]

  return {
    shouldDeleteOldest: true,
    oldestGenerationId: oldestGeneration.id,
  }
}

/**
 * 新しい世代番号を決定する
 */
export async function getNextGenerationNumber(ruleId: string): Promise<number> {
  const supabase = await createClient()

  const { data: generations, error } = await supabase
    .from('rule_generations')
    .select('generation_number')
    .eq('rule_id', ruleId)
    .order('generation_number', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`世代番号の取得に失敗しました: ${error.message}`)
  }

  if (!generations || generations.length === 0) {
    return 1
  }

  // 最大の世代番号を取得して+1
  const maxGenerationNumber = generations[0].generation_number

  // 6世代未満の場合は次の番号、6世代の場合は1に戻す（古い世代を削除するため）
  if (maxGenerationNumber < MAX_GENERATIONS) {
    return maxGenerationNumber + 1
  } else {
    // 最も古い世代を削除するため、その世代番号を使用
    const { data: oldestGeneration } = await supabase
      .from('rule_generations')
      .select('generation_number')
      .eq('rule_id', ruleId)
      .order('generation_number', { ascending: true })
      .limit(1)
      .single()

    return oldestGeneration?.generation_number || 1
  }
}

/**
 * 最も古い世代を削除する
 */
export async function deleteOldestGeneration(
  ruleId: string,
  generationId: string
): Promise<void> {
  const supabase = await createClient()

  // rule_rowsはCASCADEで自動削除される
  const { error } = await supabase
    .from('rule_generations')
    .delete()
    .eq('id', generationId)

  if (error) {
    throw new Error(`古い世代の削除に失敗しました: ${error.message}`)
  }
}

/**
 * 世代を有効化/無効化する
 */
export async function toggleGenerationActive(
  generationId: string,
  isActive: boolean
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rule_generations')
    .update({ is_active: isActive })
    .eq('id', generationId)

  if (error) {
    throw new Error(`世代の有効化/無効化に失敗しました: ${error.message}`)
  }
}



