import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    return NextResponse.json({
      success: true,
      users: whitelistUsers
    })
  } catch (error) {
    console.error('获取白名单失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}