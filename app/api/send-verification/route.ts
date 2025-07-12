import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendVerificationCode } from '@/lib/email'
import { generateVerificationCode, isValidQQNumber } from '@/lib/utils'

// 验证码有效期（10分钟）
const CODE_EXPIRY = 10 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const { qq } = await request.json()

    if (!qq || !isValidQQNumber(qq)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的QQ号' },
        { status: 400 }
      )
    }

    const email = `${qq}@qq.com`

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', parseInt(qq))
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '该QQ号已注册' },
        { status: 400 }
      )
    }

    // 生成验证码
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY)

    // 存储验证码到数据库
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString()
      })

    if (insertError) {
      console.error('验证码存储失败:', insertError)
      return NextResponse.json(
        { success: false, message: '验证码存储失败' },
        { status: 500 }
      )
    }

    // 发送邮件
    const emailSent = await sendVerificationCode(email, code)

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: '邮件发送失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送到您的QQ邮箱'
    })
  } catch (error) {
    console.error('Send verification code error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}