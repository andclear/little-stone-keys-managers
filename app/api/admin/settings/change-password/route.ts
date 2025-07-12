import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, verifyPassword } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: '当前密码和新密码不能为空' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: '新密码长度不能少于6位' }, { status: 400 })
    }

    // 获取当前管理员信息（这里需要从session或token中获取，暂时使用默认管理员）
    // 在实际应用中，应该从认证中间件或session中获取当前登录的管理员ID
    const adminId = 1 // 这里应该从认证信息中获取

    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .single()

    if (adminError || !admin) {
      return NextResponse.json({ success: false, error: '管理员不存在' }, { status: 404 })
    }

    // 验证当前密码
    const isCurrentPasswordValid = await verifyPassword(currentPassword, admin.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ success: false, error: '当前密码不正确' }, { status: 400 })
    }

    // 加密新密码
    const hashedNewPassword = await hashPassword(newPassword)

    // 更新密码
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ password_hash: hashedNewPassword })
      .eq('id', adminId)

    if (updateError) {
      console.error('更新密码失败:', updateError)
      return NextResponse.json({ success: false, error: '更新密码失败' }, { status: 500 })
    }

    // 记录操作日志
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          admin_id: adminId,
          action: `修改密码: ${admin.username}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}