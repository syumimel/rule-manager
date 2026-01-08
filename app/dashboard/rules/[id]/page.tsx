import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RuleDetail from '@/components/RuleDetail'

interface PageProps {
  params: {
    id: string
  }
}

export default async function RuleDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // ルールを取得
  const { data: rule, error } = await supabase
    .from('rules')
    .select(`
      id,
      name,
      category,
      created_at,
      updated_at,
      rule_generations (
        id,
        generation_number,
        uploaded_at,
        uploaded_by,
        row_count,
        is_active,
        is_archived
      )
    `)
    .eq('id', params.id)
    .eq('fortune_teller_id', user.id)
    .single()

  if (error || !rule) {
    notFound()
  }

  // 世代をソート（新しい順）
  const sortedGenerations = rule.rule_generations
    ? [...rule.rule_generations].sort((a, b) => b.generation_number - a.generation_number)
    : []

  return (
    <div>
      <div className="mb-6">
        <a
          href="/dashboard/rules"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← ルール一覧に戻る
        </a>
      </div>

      <RuleDetail rule={rule} generations={sortedGenerations} />
    </div>
  )
}



