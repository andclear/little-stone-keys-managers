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

    // 获取总数
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('获取用户总数失败:', countError)
      return NextResponse.json({ success: false, error: '获取用户总数失败' }, { status: 500 })
    }

    // 获取分页用户及其密钥信息
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        nickname,
        email,
        is_banned,
        created_at,
        keys!claimed_by_user_id(
          key_value,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json({ success: false, error: '获取用户列表失败' }, { status: 500 })
    }

    // 处理用户数据，添加已领取的密钥信息
    const processedUsers = users.map(user => ({
      ...user,
      claimed_key: user.keys?.find(key => key.status === 'claimed')?.key_value || null,
      keys: undefined // 移除原始keys数据
    }))

    return NextResponse.json({
      success: true,
      users: processedUsers,
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}