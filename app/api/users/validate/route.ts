import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: '用户ID不能为空' }, { status: 400 })
    }

    // 验证用户是否存在且未被删除
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nickname, email, is_banned, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      // 如果是用户不存在的错误，返回用户已删除
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          userDeleted: true,
          message: '用户账户已被删除'
        })
      }
      
      console.error('验证用户失败:', error)
      return NextResponse.json({ success: false, error: '验证用户失败' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        userDeleted: true,
        message: '用户账户已被删除'
      })
    }

    // 用户存在，返回最新的用户信息
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        is_banned: user.is_banned,
        created_at: user.created_at
      }
    })
  } catch (error) {
    console.error('验证用户失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}