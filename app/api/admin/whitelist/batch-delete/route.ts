import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 强制动态渲染，禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, qqList } = body

    // 验证输入参数
    if (!ids && !qqList) {
      return NextResponse.json({ success: false, error: '请提供要删除的ID列表或QQ号列表' }, { status: 400 })
    }

    if (ids && (!Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ success: false, error: 'ID列表格式无效' }, { status: 400 })
    }

    if (qqList && (!Array.isArray(qqList) || qqList.length === 0)) {
      return NextResponse.json({ success: false, error: 'QQ号列表格式无效' }, { status: 400 })
    }

    let usersToDelete: any[]
    let queryError: any
    let deleteError: any
    let logMessage: string

    if (ids) {
      // whitelist表没有id字段，不支持通过ID删除
      return NextResponse.json({ 
        success: false, 
        error: 'whitelist表不支持通过ID删除，请使用QQ号列表删除' 
      }, { status: 400 })
    } else {
      // 通过QQ号列表删除
      // 验证QQ号格式
      const validQQs: string[] = []
      const invalidQQs: string[] = []
      
      for (const qq of qqList) {
        const qqStr = qq.toString().trim()
        if (/^[1-9][0-9]{4,10}$/.test(qqStr)) {
          validQQs.push(qqStr)
        } else {
          invalidQQs.push(qqStr)
        }
      }

      if (invalidQQs.length > 0) {
        return NextResponse.json({
          success: false,
          error: `以下QQ号格式无效: ${invalidQQs.join(', ')}`,
          invalidQQs
        }, { status: 400 })
      }

      const qqNumbers = validQQs.map(qq => parseInt(qq))
      logMessage = `批量删除白名单用户 (通过QQ号): ${validQQs.join(', ')}`
      
      // 查询要删除的用户（用于日志记录）
      const queryResult = await supabase
        .from('whitelist')
        .select('qq_number')
        .in('qq_number', qqNumbers)
      
      usersToDelete = queryResult.data || []
      queryError = queryResult.error
      
      if (!queryError && usersToDelete.length > 0) {
        // 执行批量删除
        const deleteResult = await supabase
          .from('whitelist')
          .delete()
          .in('qq_number', qqNumbers)
        deleteError = deleteResult.error
      }
    }

    if (queryError) {
      console.error('查询要删除的用户失败:', queryError)
      return NextResponse.json({ success: false, error: '查询要删除的用户失败: ' + queryError.message }, { status: 500 })
    }

    if (!usersToDelete || usersToDelete.length === 0) {
      return NextResponse.json({ success: false, error: '没有找到要删除的用户' }, { status: 404 })
    }

    if (deleteError) {
      console.error('批量删除白名单用户失败:', deleteError)
      return NextResponse.json({ success: false, error: '批量删除白名单用户失败: ' + deleteError.message }, { status: 500 })
    }

    // 记录操作日志
    try {
      const adminData = request.headers.get('admin-data')
      let adminId = 1 // 默认管理员ID
      
      if (adminData) {
        const admin = JSON.parse(adminData)
        adminId = admin.id
      }

      const deletedQQs = usersToDelete.map(user => user.qq_number).join(', ')
      await supabase
        .from('audit_logs')
        .insert({
          admin_id: adminId,
          action: `批量删除白名单用户: ${deletedQQs} (共${usersToDelete.length}个)`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `成功删除 ${usersToDelete.length} 个白名单用户`,
      deletedCount: usersToDelete.length,
      deletedUsers: usersToDelete
    })
  } catch (error) {
    console.error('批量删除白名单用户失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}