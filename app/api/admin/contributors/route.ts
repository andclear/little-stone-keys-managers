import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: contributors, error } = await supabase
      .from('contributors')
      .select('*')
      .order('points', { ascending: false })

    if (error) {
      console.error('获取贡献者列表失败:', error)
      return NextResponse.json({ success: false, error: '获取贡献者列表失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contributors
    })
  } catch (error) {
    console.error('获取贡献者列表失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nickname, avatar_url, points } = await request.json()

    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ success: false, error: '贡献者昵称不能为空' }, { status: 400 })
    }

    if (!avatar_url || !avatar_url.trim()) {
      return NextResponse.json({ success: false, error: '头像URL不能为空' }, { status: 400 })
    }

    // 检查昵称是否已存在
    const { data: existing, error: checkError } = await supabase
      .from('contributors')
      .select('id')
      .eq('nickname', nickname.trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      console.error('检查贡献者昵称失败:', checkError)
      return NextResponse.json({ success: false, error: '检查贡献者昵称失败' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ success: false, error: '该昵称已存在' }, { status: 400 })
    }

    // 添加新贡献者
    const { data: newContributor, error: insertError } = await supabase
      .from('contributors')
      .insert({
        nickname: nickname.trim(),
        avatar_url: avatar_url.trim(),
        points: Math.max(0, parseInt(points) || 0),
        likes_count: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('添加贡献者失败:', insertError)
      return NextResponse.json({ success: false, error: '添加贡献者失败' }, { status: 500 })
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
          action: `添加贡献者: ${nickname.trim()}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      contributor: newContributor,
      message: '贡献者添加成功'
    })
  } catch (error) {
    console.error('添加贡献者失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}