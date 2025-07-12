import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: '用户ID不能为空' }, { status: 400 })
    }

    // 检查用户是否存在
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })
    }

    // 先将该用户领取的密钥设为失效
    const { error: keyError } = await supabaseAdmin
      .from('keys')
      .update({ 
        status: 'void',
        claimed_by_user_id: null,
        claimed_at: null
      })
      .eq('claimed_by_user_id', userId)
      .eq('status', 'claimed')

    if (keyError) {
      console.error('更新密钥状态失败:', keyError)
      return NextResponse.json({ success: false, error: '删除用户失败：无法处理相关密钥' }, { status: 500 })
    }

    // 删除用户的点赞记录（由于外键约束，会自动删除）
    // 删除用户记录
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('删除用户失败:', deleteError)
      return NextResponse.json({ success: false, error: '删除用户失败' }, { status: 500 })
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
          action: `删除用户 ID: ${userId}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: '用户已删除'
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}