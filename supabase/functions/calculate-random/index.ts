// Supabase Edge Function: 乱数生成
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
    const { rule_generation_id } = await req.json()

    if (!rule_generation_id) {
      return new Response(
        JSON.stringify({ error: 'rule_generation_idが必要です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabaseクライアントを作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 世代の行数を取得
    const { data: generation, error: genError } = await supabase
      .from('rule_generations')
      .select('row_count')
      .eq('id', rule_generation_id)
      .single()

    if (genError || !generation) {
      return new Response(
        JSON.stringify({ error: '世代が見つかりません' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1からrow_countまでの乱数を生成
    const randomValue = Math.floor(Math.random() * generation.row_count) + 1

    return new Response(
      JSON.stringify({
        result_value: randomValue,
        additional_values: {
          row_count: generation.row_count,
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



