import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { qqList } = await request.json()

    if (!qqList || !Array.isArray(qqList) || qqList.length === 0) {
      return NextResponse.json({ success: false, error: 'QQ号列表不能为空' }, { status: 400 })
    }

    // 验证QQ号格式
    const validQQs = []
    const invalidQQs = []
    
    for (const username of qqList) {
      const trimmedUsername = username.toString().trim()
      if (/^[1-9]\d{4,10}$/.test(trimmedUsername)) {
        validQQs.push(parseInt(trimmedUsername))
      } else {
        invalidQQs.push(trimmedUsername)
      }
    }

    if (validQQs.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '没有有效的QQ号',
        invalidQQs 
      }, { status: 400 })
    }

    // 检查已存在的QQ号
    const { data: existingUsers, error: checkError } = await supabase
      .from('whitelist')
      .select('qq_number')
      .in('qq_number', validQQs)

    if (checkError) {
      console.error('检查重复QQ号失败:', checkError)
      return NextResponse.json({ success: false, error: '检查重复QQ号失败' }, { status: 500 })
    }

    const existingQQs = existingUsers?.map(user => user.qq_number) || []
    const newQQs = validQQs.filter(qq => !existingQQs.includes(qq))
    const duplicateQQs = validQQs.filter(qq => existingQQs.includes(qq))

    if (newQQs.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '所有QQ号都已存在于白名单中',
        duplicateQQs,
        invalidQQs: invalidQQs.length > 0 ? invalidQQs : undefined
      }, { status: 400 })
    }

    // 批量插入新的QQ号
    const insertData = newQQs.map(qq => ({
      qq_number: qq
    }))

    const { data, error } = await supabase
      .from('whitelist')
      .insert(insertData)
      .select()

    if (error) {
      console.error('批量添加白名单失败:', error)
      return NextResponse.json({ success: false, error: '批量添加白名单失败' }, { status: 500 })
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
          action: `批量添加白名单用户: ${newQQs.length}个用户`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `成功添加 ${newQQs.length} 个用户到白名单`,
      addedCount: newQQs.length,
      duplicateQQs: duplicateQQs.length > 0 ? duplicateQQs : undefined,
      invalidQQs: invalidQQs.length > 0 ? invalidQQs : undefined
    })
  } catch (error) {
    console.error('批量添加白名单失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}