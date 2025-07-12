import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: whitelistUsers, error } = await supabaseAdmin
      .from('whitelist')
      .select('id, qq_number, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取白名单失败:', error)
      return NextResponse.json({ success: false, error: '获取白名单失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: whitelistUsers
    })
  } catch (error) {
    console.error('获取白名单失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}