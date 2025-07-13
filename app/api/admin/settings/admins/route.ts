import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: admins, error } = await supabaseAdmin
      .from('admins')
      .select('id, username, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取管理员列表失败:', error)
      return NextResponse.json({ success: false, error: '获取管理员列表失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      admins
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}