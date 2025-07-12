import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/utils'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // 使用默认配置或传入的参数
    const adminUsername = username || config.admin.defaultUsername
    const adminPassword = password || config.admin.defaultPassword

    // 生成密码哈希
    const passwordHash = await hashPassword(adminPassword)

    // 检查管理员是否已存在
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('username', adminUsername)
      .single()

    if (existingAdmin) {
      // 更新现有管理员密码
      const { error } = await supabaseAdmin
        .from('admins')
        .update({ password_hash: passwordHash })
        .eq('username', adminUsername)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: '管理员密码已更新',
        passwordHash
      })
    } else {
      // 创建新管理员
      const { error } = await supabaseAdmin
        .from('admins')
        .insert({
          username: adminUsername,
          password_hash: passwordHash
        })

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: '管理员账户已创建',
        passwordHash
      })
    }
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { success: false, message: '设置管理员账户失败' },
      { status: 500 }
    )
  }
}