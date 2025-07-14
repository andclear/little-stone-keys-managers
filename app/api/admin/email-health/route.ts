import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailService } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'

// 邮件服务健康检查API（仅管理员可访问）
export async function GET(request: NextRequest) {
  try {
    // 管理员验证 - 与其他管理员API保持一致
    const adminData = request.headers.get('admin-data')
    if (!adminData) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    // 验证管理员数据格式
    try {
      JSON.parse(adminData)
    } catch {
      return NextResponse.json(
        { success: false, message: '无效的管理员数据' },
        { status: 401 }
      )
    }

    // 检查邮件服务状态
    const emailServiceHealthy = await verifyEmailService()
    
    // 获取最近的邮件发送统计
    const { data: recentCodes, error } = await supabaseAdmin
      .from('verification_codes')
      .select('created_at, used')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 最近24小时
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('获取验证码统计失败:', error)
    }

    const stats = {
      total: recentCodes?.length || 0,
      used: recentCodes?.filter(code => code.used).length || 0,
      unused: recentCodes?.filter(code => !code.used).length || 0,
      usageRate: recentCodes?.length ? 
        ((recentCodes.filter(code => code.used).length / recentCodes.length) * 100).toFixed(2) + '%' : 
        'N/A'
    }

    return NextResponse.json({
      success: true,
      data: {
        emailService: {
          status: emailServiceHealthy ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString()
        },
        statistics: {
          last24Hours: stats
        },
        recommendations: emailServiceHealthy ? [] : [
          '检查SMTP服务器配置',
          '验证邮箱账户和密码',
          '确认网络连接正常',
          '检查邮件服务商的发送限制'
        ]
      }
    })
  } catch (error) {
    console.error('邮件健康检查失败:', error)
    return NextResponse.json(
      { success: false, message: '健康检查失败' },
      { status: 500 }
    )
  }
}

// 邮件服务重启API
export async function POST(request: NextRequest) {
  try {
    // 管理员验证 - 与其他管理员API保持一致
    const adminData = request.headers.get('admin-data')
    if (!adminData) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      )
    }

    // 验证管理员数据格式
    try {
      JSON.parse(adminData)
    } catch {
      return NextResponse.json(
        { success: false, message: '无效的管理员数据' },
        { status: 401 }
      )
    }

    // 这里可以添加重启邮件服务的逻辑
    // 例如：重新创建transporter、清理连接池等
    
    const isHealthy = await verifyEmailService()
    
    return NextResponse.json({
      success: true,
      message: '邮件服务检查完成',
      status: isHealthy ? 'healthy' : 'unhealthy'
    })
  } catch (error) {
    console.error('邮件服务重启失败:', error)
    return NextResponse.json(
      { success: false, message: '服务重启失败' },
      { status: 500 }
    )
  }
}