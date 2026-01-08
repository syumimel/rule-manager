import { createClient } from '@/lib/supabase/server'
import LineSettingsForm from '@/components/LineSettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // LINE設定を取得
  const { data: lineSettings } = await supabase
    .from('line_settings')
    .select('channel_id, channel_secret')
    .eq('fortune_teller_id', user.id)
    .single()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">設定</h1>
      
      <div className="mb-8">
        <LineSettingsForm initialSettings={lineSettings} />
      </div>
    </div>
  )
}



