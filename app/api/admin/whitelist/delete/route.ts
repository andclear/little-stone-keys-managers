import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 强制动态渲染，禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(request: NextRequest) {
  try {
    const { qq_number } = await request.json()

    if (!qq_number) {
      return NextResponse.json({ success: false, error: '白名单用户QQ号不能为空' }, { status: 400 })
    }

    // 检查白名单用户是否存在
    const { data: existingUser, error: checkError } = await supabase
      .from('whitelist')
      .select('*')
      .eq('qq_number', qq_number)
      .single()

    if (checkError || !existingUser) {
      return NextResponse.json({ success: false, error: '白名单用户不存在' }, { status: 404 })
    }

    // 删除白名单用户
    const { error: deleteError } = await supabase
      .from('whitelist')
      .delete()
      .eq('qq_number', qq_number)

    if (deleteError) {
      console.error('删除白名单用户失败:', deleteError)
      return NextResponse.json({ success: false, error: '删除白名单用户失败' }, { status: 500 })
    }

    // 将该用户的密钥状态设置为失效
    const { error: keyUpdateError } = await supabase
      .from('keys')
      .update({ status: 'void' })
      .eq('claimed_by_user_id', qq_number)
      .eq('status', 'claimed')

    if (keyUpdateError) {
      console.error('更新密钥状态失败:', keyUpdateError)
      // 不返回错误，因为白名单删除已成功，密钥失效是附加操作
    }

    // 记录操作日志
    try {
      const adminData = request.headers.get('admin-data')
      let adminId = 1 // 默认管理员ID
      
      if (adminData) {
        const admin = JSON.parse(adminData)
        adminId = admin.id
      }

      await supabase
        .from('audit_logs')
        .insert({
          admin_id: adminId,
          action: `删除白名单用户: ${existingUser.qq_number}，同时失效其密钥`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: '白名单用户删除成功，相关密钥已失效'
    })
  } catch (error) {
    console.error('删除白名单用户失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}