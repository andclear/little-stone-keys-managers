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

    // 删除管理员
    const { error: deleteError } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('删除管理员失败:', deleteError)
      return NextResponse.json({ success: false, error: '删除管理员失败' }, { status: 500 })
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