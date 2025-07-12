import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    // 清除所有操作日志
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .delete()
      .neq('id', 0) // 删除所有记录

    if (error) {
      console.error('清除操作日志失败:', error)
      return NextResponse.json(
        { message: '清除操作日志失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '所有操作日志已清除',
      success: true 
    })

  } catch (error) {
    console.error('清除操作日志失败:', error)
    return NextResponse.json(
      { message: '清除操作日志失败' },
      { status: 500 }
    )
  }
}