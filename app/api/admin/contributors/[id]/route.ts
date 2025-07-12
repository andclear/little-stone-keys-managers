import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, error: '贡献者ID不能为空或无效' }, { status: 400 })
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

    // 删除相关的点赞记录
    const { error: likesDeleteError } = await supabase
      .from('likes')
      .delete()
      .eq('contributor_id', id)

    if (likesDeleteError) {
      console.error('删除点赞记录失败:', likesDeleteError)
      return NextResponse.json({ success: false, error: '删除相关数据失败' }, { status: 500 })
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
          action: `删除贡献者: ${existingContributor.nickname} (ID: ${id})`
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