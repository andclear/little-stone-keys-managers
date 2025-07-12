import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, isValidQQNumber, isValidPassword } from '@/lib/utils'
import { verifyCode } from '../../send-verification/route'

export async function POST(request: NextRequest) {
  try {
    console.log('用户注册API被调用')
    const { qq, nickname, password, verificationCode } = await request.json()
    console.log('接收到的注册数据:', { qq, nickname, password: '***', verificationCode })

    // 验证输入
    if (!qq || !nickname || !password || !verificationCode) {
      console.log('必填字段缺失')
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    if (!isValidQQNumber(qq)) {
      console.log('QQ号格式无效:', qq)
      return NextResponse.json(
        { success: false, message: '请输入有效的QQ号' },
        { status: 400 }
      )
    }

    if (!isValidPassword(password)) {
      console.log('密码格式无效')
      return NextResponse.json(
        { success: false, message: '密码至少6位，包含字母和数字' },
        { status: 400 }
      )
    }

    const email = `${qq}@qq.com`
    const userId = parseInt(qq)

    // 验证验证码
    console.log('验证验证码...')
    const isCodeValid = await verifyCode(email, verificationCode)
    console.log('验证码验证结果:', isCodeValid)
    
    if (!isCodeValid) {
      console.log('验证码验证失败')
      return NextResponse.json(
        { success: false, message: '验证码错误或已过期' },
        { status: 400 }
      )
    }
    console.log('验证码验证成功')

    // 检查用户是否已存在
    console.log('检查用户是否已存在...')
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', qq)
      .single()

    if (existingUser) {
      console.log('用户已存在')
      return NextResponse.json(
        { success: false, message: '该QQ号已注册' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    console.log('检查邮箱是否已存在:', email)
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingEmail) {
      console.log('邮箱已存在')
      return NextResponse.json(
        { success: false, message: '该邮箱已注册' },
        { status: 400 }
      )
    }

    // 加密密码
    console.log('加密密码...')
    const passwordHash = await hashPassword(password)

    // 创建用户
    console.log('创建用户...')
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

    console.log('用户创建成功:', newUser.id)

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

    console.log('注册成功，返回用户数据')
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