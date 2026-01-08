import { createClient } from '@/lib/supabase/server'
import { FortuneTypeDefinition } from '@/modules/fortune-type/types'

export interface CalculationInput {
  fortune_type_id: string
  input_data: Record<string, any>
  rule_generation_id: string
}

export interface CalculationOutput {
  result_value: number
  additional_values?: Record<string, any>
}

/**
 * 計算ロジックを外部関数として呼び出す
 */
export async function callCalculationFunction(
  calculationFunctionPath: string,
  input: CalculationInput
): Promise<CalculationOutput> {
  // Supabase Edge Functionsの場合
  if (calculationFunctionPath.startsWith('supabase/functions/')) {
    return await callSupabaseEdgeFunction(calculationFunctionPath, input)
  }

  // 外部APIの場合
  if (calculationFunctionPath.startsWith('http://') || calculationFunctionPath.startsWith('https://')) {
    return await callExternalAPI(calculationFunctionPath, input)
  }

  throw new Error(`無効な計算関数パス: ${calculationFunctionPath}`)
}

/**
 * Supabase Edge Functionを呼び出す
 */
async function callSupabaseEdgeFunction(
  functionPath: string,
  input: CalculationInput
): Promise<CalculationOutput> {
  const supabase = await createClient()
  
  // functionPathから関数名を抽出
  // 例: "supabase/functions/calculate-numerology" -> "calculate-numerology"
  const functionName = functionPath.replace('supabase/functions/', '')
  
  // Supabase Edge FunctionsのURLを構築
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`

  // Service Role Keyを使用して呼び出し
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Edge Function呼び出しエラー: ${response.status} ${errorText}`)
  }

  const result = await response.json()

  // result_valueが必須
  if (typeof result.result_value !== 'number') {
    throw new Error('計算結果のresult_valueが数値ではありません')
  }

  return {
    result_value: result.result_value,
    additional_values: result.additional_values,
  }
}

/**
 * 外部APIを呼び出す
 */
async function callExternalAPI(
  apiUrl: string,
  input: CalculationInput
): Promise<CalculationOutput> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    // タイムアウト設定（5秒）
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`外部API呼び出しエラー: ${response.status} ${errorText}`)
  }

  const result = await response.json()

  // result_valueが必須
  if (typeof result.result_value !== 'number') {
    throw new Error('計算結果のresult_valueが数値ではありません')
  }

  return {
    result_value: result.result_value,
    additional_values: result.additional_values,
  }
}

/**
 * 占いタイプ定義を取得
 */
export async function getFortuneTypeDefinition(
  fortuneTypeId: string,
  userId: string
): Promise<FortuneTypeDefinition | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fortune_types')
    .select('definition')
    .eq('fortune_type_id', fortuneTypeId)
    .eq('fortune_teller_id', userId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return data.definition as FortuneTypeDefinition
}



