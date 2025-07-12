import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 获取API基础URL
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('value')
      .eq('key', 'api_base_url')
      .single()

    if (error) {
      console.error('获取API基础URL失败:', error)
      return NextResponse.json({ success: false, error: '获取API基础URL失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      apiBaseUrl: data?.value || 'https://api.xiaoshizi.com/v1'
    })
  } catch (error) {
    console.error('获取API基础URL失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}

// 更新API基础URL
export async function PUT(request: NextRequest) {
  try {
    const { apiBaseUrl } = await request.json()

    if (!apiBaseUrl || !apiBaseUrl.trim()) {
      return NextResponse.json({ success: false, error: 'API调用地址不能为空' }, { status: 400 })
    }

    // 验证URL格式
    try {
      new URL(apiBaseUrl)
    } catch {
      return NextResponse.json({ success: false, error: '请输入有效的URL格式' }, { status: 400 })
    }

    // 更新数据库中的配置
    const { error } = await supabaseAdmin
      .from('system_config')
      .upsert({
        key: 'api_base_url',
        value: apiBaseUrl.trim()
      }, {
        onConflict: 'key'
      })

    if (error) {
      console.error('更新API基础URL失败:', error)
      return NextResponse.json({ success: false, error: '更新API基础URL失败' }, { status: 500 })
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
          action: `修改API调用地址: ${apiBaseUrl}`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'API调用地址更新成功'
    })
  } catch (error) {
    console.error('更新API基础URL失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}