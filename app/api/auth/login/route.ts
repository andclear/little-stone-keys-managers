import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPassword, isValidQQNumber } from '@/lib/utils'

// 强制动态渲染，禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { qq, password } = await request.json()

    // 验证输入
    if (!qq || !password) {
      return NextResponse.json(
        { success: false, message: '请输入QQ号和密码' },
        { status: 400 }
      )
    }

    if (!isValidQQNumber(qq)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的QQ号' },
        { status: 400 }
      )
    }

    const userId = parseInt(qq)

    // 查找用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: 'QQ号或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'QQ号或密码错误' },
        { status: 401 }
      )
    }

    // 检查用户是否有已领取的密钥
    const { data: userKey } = await supabase
      .from('keys')
      .select('key_value')
      .eq('claimed_by_user_id', userId)
      .eq('status', 'claimed')
      .single()

    const userWithKey = {
      ...user,
      key: userKey?.key_value || null
    }

    // 移除密码哈希
    delete userWithKey.password_hash

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: userWithKey
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}