import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    console.log('管理员登录API被调用')
    const { username, password } = await request.json()
    console.log('接收到的登录数据:', { username, password: '***' })

    // 验证输入
    if (!username || !password) {
      console.log('用户名或密码为空')
      return Response.json({ success: false, message: '用户名和密码不能为空' })
    }

    // 查找管理员
    console.log('查找管理员:', username)
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('username', username)
      .single()

    console.log('数据库查询结果:', { admin: admin ? '找到管理员' : '未找到', error })

    if (error || !admin) {
      console.log('管理员不存在或查询错误')
      return Response.json({ success: false, message: '用户名或密码错误' })
    }

    // 验证密码
    console.log('验证密码...')
    const isValidPassword = await verifyPassword(password, admin.password_hash)
    console.log('密码验证结果:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('密码验证失败')
      return Response.json({ success: false, message: '用户名或密码错误' })
    }

    // 移除密码哈希
    const { password_hash, ...adminData } = admin
    console.log('登录成功，返回管理员数据')

    return Response.json({
      success: true,
      message: '登录成功',
      admin: adminData
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return Response.json({ success: false, message: '服务器错误' })
  }
}