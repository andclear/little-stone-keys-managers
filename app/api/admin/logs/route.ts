import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 强制动态渲染
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const date = searchParams.get('date')
    const admin = searchParams.get('admin')
    
    const offset = (page - 1) * limit

    // 构建查询
    let query = supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        admin:admins(username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 应用搜索筛选
    if (search) {
      query = query.ilike('action', `%${search}%`)
    }

    // 应用日期筛选
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
    }

    // 应用管理员筛选
    if (admin) {
      // 先查询管理员ID
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('id')
        .ilike('username', `%${admin}%`)

      if (adminError) {
        console.error('查询管理员失败:', adminError)
        return NextResponse.json({ success: false, error: '查询管理员失败' }, { status: 500 })
      }

      if (adminData && adminData.length > 0) {
        const adminIds = adminData.map(a => a.id)
        query = query.in('admin_id', adminIds)
      } else {
        // 如果没有找到匹配的管理员，返回空结果
        return NextResponse.json({
          success: true,
          logs: [],
          total: 0
        })
      }
    }

    // 应用分页
    query = query.range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('获取操作日志失败:', error)
      return NextResponse.json({ success: false, error: '获取操作日志失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('获取操作日志失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}