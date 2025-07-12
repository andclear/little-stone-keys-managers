import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 强制动态渲染，禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: '用户ID不能为空' }, { status: 400 })
    }

    // 验证用户是否存在且未被删除，同时获取用户的有效密钥
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, 
        nickname, 
        email, 
        is_banned, 
        created_at,
        keys!claimed_by_user_id(
          key_value,
          status
        )
      `)
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

    // 获取用户的有效密钥（状态为claimed的密钥）
    const validKey = user.keys?.find((key: any) => key.status === 'claimed')
    
    // 用户存在，返回最新的用户信息和有效密钥
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        is_banned: user.is_banned,
        created_at: user.created_at,
        key: validKey?.key_value || null
      }
    })
  } catch (error) {
    console.error('验证用户失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}