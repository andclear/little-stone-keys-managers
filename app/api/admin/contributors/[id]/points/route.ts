import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { adjustment } = await request.json()
    const contributorId = parseInt(params.id)

    if (!contributorId || isNaN(contributorId)) {
      return NextResponse.json({ success: false, error: '无效的贡献者ID' }, { status: 400 })
    }

    if (adjustment === undefined || isNaN(adjustment)) {
      return NextResponse.json({ success: false, error: '积分调整值无效' }, { status: 400 })
    }

    // 获取当前贡献者信息
    const { data: contributor, error: fetchError } = await supabaseAdmin
      .from('contributors')
      .select('id, nickname, points')
      .eq('id', contributorId)
      .single()

    if (fetchError || !contributor) {
      return NextResponse.json({ success: false, error: '贡献者不存在' }, { status: 404 })
    }

    // 计算新的积分值，确保不会低于0
    const newPoints = Math.max(0, contributor.points + adjustment)

    // 更新积分
    const { error: updateError } = await supabaseAdmin
      .from('contributors')
      .update({ points: newPoints })
      .eq('id', contributorId)

    if (updateError) {
      console.error('更新积分失败:', updateError)
      return NextResponse.json({ success: false, error: '更新积分失败' }, { status: 500 })
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
          action: `调整贡献者 ${contributor.nickname} 的积分: ${adjustment > 0 ? '+' : ''}${adjustment} (${contributor.points} → ${newPoints})`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: '积分调整成功',
      oldPoints: contributor.points,
      newPoints: newPoints,
      adjustment: adjustment
    })
  } catch (error) {
    console.error('积分调整失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}