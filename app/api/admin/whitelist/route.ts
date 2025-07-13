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

    let whitelistUsers, count, error, countError

    if (search) {
      // 使用原生SQL查询进行搜索
      const searchPattern = `%${search}%`
      
      // 获取搜索结果总数
      const { data: countData, error: countErr } = await supabase
        .rpc('count_whitelist_search', { search_pattern: searchPattern })
      
      if (countErr) {
        // 如果RPC函数不存在，使用备用方案
        const { data: allData, error: allError } = await supabase
          .from('whitelist')
          .select('qq_number')
        
        if (allError) {
          console.error('获取白名单失败:', allError)
          return NextResponse.json({ success: false, error: '获取白名单失败' }, { status: 500 })
        }
        
        // 在客户端进行过滤
        const filteredData = allData.filter(item => 
          item.qq_number.toString().includes(search)
        )
        count = filteredData.length
        
        // 获取分页数据
        const paginatedQQs = filteredData
          .slice(offset, offset + limit)
          .map(item => item.qq_number)
        
        if (paginatedQQs.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from('whitelist')
            .select('qq_number, created_at')
            .in('qq_number', paginatedQQs)
            .order('created_at', { ascending: false })
          
          whitelistUsers = userData
          error = userError
        } else {
          whitelistUsers = []
          error = null
        }
      } else {
        count = countData
        
        // 获取搜索结果数据
        const { data: searchData, error: searchError } = await supabase
          .rpc('search_whitelist', { 
            search_pattern: searchPattern,
            limit_count: limit,
            offset_count: offset
          })
        
        whitelistUsers = searchData
        error = searchError
      }
    } else {
      // 无搜索条件的常规查询
      const { count: totalCount, error: countErr } = await supabase
        .from('whitelist')
        .select('*', { count: 'exact', head: true })
      
      count = totalCount
      countError = countErr
      
      if (countError) {
        console.error('获取白名单总数失败:', countError)
        return NextResponse.json({ success: false, error: '获取白名单总数失败' }, { status: 500 })
      }
      
      const { data: userData, error: userError } = await supabase
        .from('whitelist')
        .select('qq_number, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      whitelistUsers = userData
      error = userError
    }

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