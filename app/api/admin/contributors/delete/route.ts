import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: '贡献者ID不能为空' }, { status: 400 })
    }

    // 检查贡献者是否存在
    const { data: existingContributor, error: checkError } = await supabase
      .from('contributors')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingContributor) {
      return NextResponse.json({ success: false, error: '贡献者不存在' }, { status: 404 })
    }

    // 删除贡献者
    const { error: deleteError } = await supabase
      .from('contributors')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('删除贡献者失败:', deleteError)
      return NextResponse.json({ success: false, error: '删除贡献者失败' }, { status: 500 })
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
          action: `删除贡献者: ${existingContributor.nickname}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: '贡献者删除成功'
    })
  } catch (error) {
    console.error('删除贡献者失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}