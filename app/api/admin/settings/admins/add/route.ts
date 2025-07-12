import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !username.trim()) {
      return NextResponse.json({ success: false, error: '用户名不能为空' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: '密码长度不能少于6位' }, { status: 400 })
    }

    // 检查用户名是否已存在
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('username', username.trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('检查管理员用户名失败:', checkError)
      return NextResponse.json({ success: false, error: '检查管理员用户名失败' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ success: false, error: '该用户名已存在' }, { status: 400 })
    }

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 添加新管理员
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admins')
      .insert({
        username: username.trim(),
        password_hash: hashedPassword
      })
      .select('id, username, created_at')
      .single()

    if (insertError) {
      console.error('添加管理员失败:', insertError)
      return NextResponse.json({ success: false, error: '添加管理员失败' }, { status: 500 })
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
          action: `添加管理员: ${username.trim()}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      admin: newAdmin,
      message: '管理员添加成功'
    })
  } catch (error) {
    console.error('添加管理员失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}