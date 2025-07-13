import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // 添加时间戳强制刷新查询
    const timestamp = new Date().getTime()
    console.log(`[${timestamp}] 开始获取管理员列表`)
    
    // 强制刷新数据库连接并获取最新数据
    const { data: admins, error } = await supabaseAdmin
      .from('admins')
      .select('id, username, created_at')
      .order('created_at', { ascending: true })
    
    console.log(`[${timestamp}] 获取到管理员数据:`, admins)

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