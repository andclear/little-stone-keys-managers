import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: '管理员ID不能为空' }, { status: 400 })
    }

    // 检查是否是最后一个管理员
    const { data: adminCount, error: countError } = await supabaseAdmin
      .from('admins')
      .select('id', { count: 'exact' })

    if (countError) {
      console.error('检查管理员数量失败:', countError)
      return NextResponse.json({ success: false, error: '检查管理员数量失败' }, { status: 500 })
    }

    if (adminCount && adminCount.length <= 1) {
      return NextResponse.json({ success: false, error: '不能删除最后一个管理员' }, { status: 400 })
    }

    // 检查管理员是否存在
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingAdmin) {
      return NextResponse.json({ success: false, error: '管理员不存在' }, { status: 404 })
    }

    // 获取当前操作的管理员ID（用于更新audit_logs）
    const adminData = request.headers.get('admin-data')
    let currentAdminId = 1 // 默认管理员ID
    
    if (adminData) {
      const admin = JSON.parse(adminData)
      currentAdminId = admin.id
    }

    // 如果要删除的是当前操作的管理员，需要找到另一个管理员ID
    let targetAdminId = currentAdminId
    if (currentAdminId === id) {
      const { data: otherAdmins, error: otherAdminsError } = await supabaseAdmin
        .from('admins')
        .select('id')
        .neq('id', id)
        .limit(1)
      
      if (otherAdminsError || !otherAdmins || otherAdmins.length === 0) {
        console.error('无法找到其他管理员:', otherAdminsError)
        return NextResponse.json({ success: false, error: '无法找到其他管理员来接管审计日志' }, { status: 500 })
      }
      
      targetAdminId = otherAdmins[0].id
    }

    // 更新audit_logs表中的admin_id，将要删除的管理员的记录转移给其他管理员
    const { error: updateLogsError } = await supabaseAdmin
      .from('audit_logs')
      .update({ admin_id: targetAdminId })
      .eq('admin_id', id)

    if (updateLogsError) {
      console.error('更新审计日志失败:', updateLogsError)
      return NextResponse.json({ success: false, error: '更新审计日志失败' }, { status: 500 })
    }

    // 删除管理员
    console.log(`准备删除管理员 ID: ${id}, 用户名: ${existingAdmin.username}`)
    const { error: deleteError } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('删除管理员失败:', deleteError)
      return NextResponse.json({ success: false, error: '删除管理员失败' }, { status: 500 })
    }
    
    console.log(`管理员删除成功 ID: ${id}`)
    
    // 验证删除是否成功
    const { data: verifyAdmin, error: verifyError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', id)
      .single()
    
    if (!verifyError && verifyAdmin) {
      console.error('警告：管理员删除后仍然存在于数据库中')
    } else {
      console.log('确认：管理员已从数据库中删除')
    }

    // 记录操作日志
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          admin_id: currentAdminId,
          action: `删除管理员: ${existingAdmin.username}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: '管理员删除成功'
    })
  } catch (error) {
    console.error('删除管理员失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}