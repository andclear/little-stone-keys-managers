import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, ban } = await request.json()

    if (!userId || typeof ban !== 'boolean') {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 })
    }

    // 开始事务处理
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, is_banned')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })
    }

    // 更新用户封禁状态
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_banned: ban })
      .eq('id', userId)

    if (updateError) {
      console.error('更新用户状态失败:', updateError)
      return NextResponse.json({ success: false, error: '更新用户状态失败' }, { status: 500 })
    }

    // 如果是封禁操作，需要将该用户的密钥设为失效
    if (ban) {
      const { error: keyError } = await supabaseAdmin
        .from('keys')
        .update({ status: 'void' })
        .eq('claimed_by_user_id', userId)
        .eq('status', 'claimed')

      if (keyError) {
        console.error('更新密钥状态失败:', keyError)
        // 这里不返回错误，因为用户状态已经更新成功
      }
    }

    // 记录操作日志
    try {
      const adminData = request.headers.get('admin-data')
      let adminId = 1 // 默认管理员ID
      
      if (adminData) {
        const admin = JSON.parse(adminData)
        adminId = admin.id
      }

      await supabaseAdmin
        .from('audit_logs')
        .insert({
          admin_id: adminId,
          action: `${ban ? '封禁' : '解封'}用户 ID: ${userId}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: ban ? '用户已封禁' : '用户已解封'
    })
  } catch (error) {
    console.error('封禁/解封用户失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}