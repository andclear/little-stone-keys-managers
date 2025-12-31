import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // 获取所有用户，只选择 id (QQ号) 和 password_hash
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, password_hash')
      .order('id', { ascending: true })

    if (error) {
      console.error('导出用户失败:', error)
      return NextResponse.json({ success: false, error: '导出用户失败' }, { status: 500 })
    }

    // 生成 CSV 内容
    // 表头: qq_number, password
    let csvContent = 'qq_number,password\n'

    if (users) {
      users.forEach(user => {
        // user.id 是 QQ号
        // user.password_hash 是加密后的密码
        csvContent += `${user.id},${user.password_hash}\n`
      })
    }

    // 返回 CSV 文件
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users_export.csv"',
      },
    })
  } catch (error) {
    console.error('导出用户失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
