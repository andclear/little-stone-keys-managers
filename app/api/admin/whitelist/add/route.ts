import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { qq } = await request.json()

    if (!qq || !qq.toString().trim()) {
      return NextResponse.json({ success: false, error: 'QQ号不能为空' }, { status: 400 })
    }

    const qqNumber = qq.toString().trim()
    
    // 验证QQ号格式
    if (!/^[1-9][0-9]{4,10}$/.test(qqNumber)) {
      return NextResponse.json({ success: false, error: '请输入有效的QQ号' }, { status: 400 })
    }

    // 检查是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('whitelist')
      .select('qq_number')
      .eq('qq_number', parseInt(qqNumber))
      .single()

    if (existingUser) {
      return NextResponse.json({ success: false, error: '该QQ号已在白名单中' }, { status: 400 })
    }

    // 添加到白名单
    const { data: newWhitelistUser, error: insertError } = await supabase
      .from('whitelist')
      .insert({
        qq_number: parseInt(qqNumber)
      })
      .select()
      .single()

    if (insertError) {
      console.error('添加白名单用户失败:', insertError)
      return NextResponse.json({ success: false, error: '添加白名单用户失败' }, { status: 500 })
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
            action: `添加白名单用户: ${qqNumber}`
          })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      user: newWhitelistUser,
      message: '白名单用户添加成功'
    })
  } catch (error) {
    console.error('添加白名单用户失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}