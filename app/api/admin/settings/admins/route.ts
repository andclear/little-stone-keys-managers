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

    const response = NextResponse.json({
      success: true,
      admins
    })
    
    // 设置强制不缓存的头部
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}