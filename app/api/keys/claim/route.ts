import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '用户ID不能为空' },
        { status: 400 }
      )
    }

    // 检查用户是否存在且未被封禁
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_banned, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    if (user.is_banned) {
      return NextResponse.json(
        { success: false, message: '账户已被封禁，无法领取密钥' },
        { status: 403 }
      )
    }

    // 检查用户ID（QQ号）是否在白名单中
    const { data: whitelistEntry, error: whitelistError } = await supabase
      .from('whitelist')
      .select('qq_number')
      .eq('qq_number', user.id)
      .single()

    if (whitelistError || !whitelistEntry) {
      return NextResponse.json(
        { success: false, message: '您的QQ号不在白名单中，无法领取密钥。请联系管理员添加到白名单。' },
        { status: 403 }
      )
    }

    // 检查用户是否已经领取过密钥
    const { data: existingKey } = await supabase
      .from('keys')
      .select('key_value')
      .eq('claimed_by_user_id', userId)
      .eq('status', 'claimed')
      .single()

    if (existingKey) {
      return NextResponse.json(
        { success: false, message: '您已经领取过密钥了' },
        { status: 400 }
      )
    }

    // 查找可用的密钥
    const { data: availableKey, error: keyError } = await supabase
      .from('keys')
      .select('id, key_value')
      .eq('status', 'unclaimed')
      .limit(1)
      .single()

    if (keyError || !availableKey) {
      return NextResponse.json(
        { success: false, message: '暂无可用密钥，请联系管理员' },
        { status: 404 }
      )
    }

    // 更新密钥状态
    const { error: updateError } = await supabase
      .from('keys')
      .update({
        status: 'claimed',
        claimed_by_user_id: userId,
        claimed_at: new Date().toISOString()
      })
      .eq('id', availableKey.id)

    if (updateError) {
      console.error('Update key error:', updateError)
      return NextResponse.json(
        { success: false, message: '密钥领取失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '密钥领取成功',
      key: availableKey.key_value
    })
  } catch (error) {
    console.error('Claim key error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}