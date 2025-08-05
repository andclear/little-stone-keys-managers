import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // 构建基础查询
    let query = supabaseAdmin.from('users').select('*', { count: 'exact', head: true })
    
    // 添加搜索条件
    if (search) {
      query = query.or(`nickname.ilike.%${search}%,email.ilike.%${search}%,id.eq.${search}`)
    }
    
    // 添加状态筛选
    if (status === 'banned') {
      query = query.eq('is_banned', true)
    } else if (status === 'normal') {
      query = query.eq('is_banned', false)
    }

    // 获取总数
    const { count, error: countError } = await query

    if (countError) {
      console.error('获取用户总数失败:', countError)
      return NextResponse.json({ success: false, error: '获取用户总数失败' }, { status: 500 })
    }

    // 构建用户查询（重新构建查询以获取数据）
    let userQuery = supabaseAdmin
      .from('users')
      .select('id, nickname, email, is_banned, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 添加相同的搜索和筛选条件
    if (search) {
      userQuery = userQuery.or(`nickname.ilike.%${search}%,email.ilike.%${search}%,id.eq.${search}`)
    }
    
    if (status === 'banned') {
      userQuery = userQuery.eq('is_banned', true)
    } else if (status === 'normal') {
      userQuery = userQuery.eq('is_banned', false)
    }

    const { data: users, error } = await userQuery

    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json({ success: false, error: '获取用户列表失败' }, { status: 500 })
    }

    // 获取用户的密钥信息（使用单独查询避免左连接问题）
    const userIds = users.map(user => user.id)
    const { data: keys, error: keysError } = await supabaseAdmin
      .from('keys')
      .select('claimed_by_user_id, key_value')
      .in('claimed_by_user_id', userIds)
      .eq('status', 'claimed')

    if (keysError) {
      console.error('获取密钥信息失败:', keysError)
      // 不阻断用户列表显示，只是没有密钥信息
    }

    // 处理用户数据，添加已领取的密钥信息
    const processedUsers = users.map(user => ({
      ...user,
      claimed_key: keys?.find(key => key.claimed_by_user_id === user.id)?.key_value || null
    }))

    return NextResponse.json({
      success: true,
      users: processedUsers,
      total: count || 0,
      page,
      limit,
      search,
      status
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}