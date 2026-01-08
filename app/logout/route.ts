import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Vercel環境ではVERCEL_URLを使用、それ以外ではNEXT_PUBLIC_APP_URLまたはlocalhost
  const appUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return NextResponse.redirect(new URL('/login', new URL(appUrl).origin))
}



