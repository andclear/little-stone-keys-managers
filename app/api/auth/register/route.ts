import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, isValidQQNumber, isValidPassword } from '@/lib/utils'
import { verifyCode } from '@/lib/utils'

// 强制动态渲染，禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const { qq, nickname, password, verificationCode } = await request.json()

    // 验证输入
    if (!qq || !nickname || !password || !verificationCode) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    if (!isValidQQNumber(qq)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的QQ号' },
        { status: 400 }
      )
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { success: false, message: '密码至少6位，包含字母和数字' },
        { status: 400 }
      )
    }

    const email = `${qq}@qq.com`
    const userId = parseInt(qq)

    // 验证验证码
    const isCodeValid = await verifyCode(email, verificationCode)
    
    if (!isCodeValid) {
      return NextResponse.json(
        { success: false, message: '验证码错误或已过期' },
        { status: 400 }
      )
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', qq)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '该QQ号已注册' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: '该邮箱已注册' },
        { status: 400 }
      )
    }

    // 加密密码
    const passwordHash = await hashPassword(password)

    // 创建用户
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: parseInt(qq),
        nickname,
        email,
        password_hash: passwordHash,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: '注册失败，请稍后重试' },
        { status: 500 }
      )
    }

    // 检查用户是否有已领取的密钥
    const { data: userKey } = await supabase
      .from('keys')
      .select('key_value')
      .eq('claimed_by_user_id', newUser.id)
      .eq('status', 'claimed')
      .single()

    const userWithKey = {
      ...newUser,
      key: userKey?.key_value || null
    }

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: userWithKey
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}