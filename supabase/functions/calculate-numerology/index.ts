// Supabase Edge Function: 数秘術の計算
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fortune_type_id, input_data, rule_generation_id } = await req.json()

    // 生年月日から数秘を計算
    const birthDate = input_data.birth_date // "19900101"
    
    if (!birthDate || typeof birthDate !== 'string') {
      return new Response(
        JSON.stringify({ error: 'birth_dateが必要です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 数字のみを抽出
    const digits = birthDate.replace(/\D/g, '').split('').map(Number)
    
    if (digits.length === 0) {
      return new Response(
        JSON.stringify({ error: '有効な生年月日を入力してください' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 各桁を合計
    let sum = digits.reduce((a, b) => a + b, 0)
    
    // 1桁になるまで計算
    while (sum > 9) {
      sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0)
    }

    return new Response(
      JSON.stringify({
        result_value: sum,
        additional_values: {
          life_path: sum,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})



