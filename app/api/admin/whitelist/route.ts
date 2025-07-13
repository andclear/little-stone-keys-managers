import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 强制动态渲染，禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // 构建查询条件
    let countQuery = supabase.from('whitelist').select('*', { count: 'exact', head: true })
    let dataQuery = supabase.from('whitelist').select('qq_number, created_at')

    // 如果有搜索条件，添加过滤
    if (search) {
      // 将qq_number转换为文本进行搜索
      countQuery = countQuery.ilike('qq_number::text', `%${search}%`)
      dataQuery = dataQuery.ilike('qq_number::text', `%${search}%`)
    }

    // 获取总数
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('获取白名单总数失败:', countError)
      return NextResponse.json({ success: false, error: '获取白名单总数失败' }, { status: 500 })
    }

    // 获取分页数据
    const { data: whitelistUsers, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取白名单失败:', error)
      return NextResponse.json({ success: false, error: '获取白名单失败' }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      users: whitelistUsers,
      total: count || 0,
      page: page,
      limit: limit
    })
    
    // 禁用缓存，确保数据实时性
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('获取白名单失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}