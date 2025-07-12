import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 强制动态渲染，禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // 用户明确要求：白名单页面只显示QQ号和创建时间，不需要关联其他任何值
    // 不要添加id字段或其他数据库内容，只查询qq_number和created_at
    // 改用普通supabase客户端以保持与密钥管理页面一致
    const { data: whitelistUsers, error } = await supabase
      .from('whitelist')
      .select('qq_number, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取白名单失败:', error)
      return NextResponse.json({ success: false, error: '获取白名单失败' }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      users: whitelistUsers
    })
    
    // 禁用缓存，确保数据实时性
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('获取白名单失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}