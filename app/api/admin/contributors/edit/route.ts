import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const { id, nickname, avatar_url, points } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: '贡献者ID不能为空' }, { status: 400 })
    }

    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ success: false, error: '贡献者昵称不能为空' }, { status: 400 })
    }

    if (!avatar_url || !avatar_url.trim()) {
      return NextResponse.json({ success: false, error: '头像URL不能为空' }, { status: 400 })
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

    // 检查昵称是否被其他贡献者使用
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .from('contributors')
      .select('id')
      .eq('nickname', nickname.trim())
      .neq('id', id)
      .single()

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('检查昵称重复失败:', duplicateError)
      return NextResponse.json({ success: false, error: '检查昵称失败' }, { status: 500 })
    }

    if (duplicateCheck) {
      return NextResponse.json({ success: false, error: '该昵称已被其他贡献者使用' }, { status: 400 })
    }

    // 更新贡献者信息
    const { data: updatedContributor, error: updateError } = await supabase
      .from('contributors')
      .update({
        nickname: nickname.trim(),
        avatar_url: avatar_url.trim(),
        points: Math.max(0, parseInt(points) || 0)
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('更新贡献者失败:', updateError)
      return NextResponse.json({ success: false, error: '更新贡献者失败' }, { status: 500 })
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
          action: `编辑贡献者: ${existingContributor.nickname} -> ${nickname.trim()}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      contributor: updatedContributor,
      message: '贡献者更新成功'
    })
  } catch (error) {
    console.error('更新贡献者失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}