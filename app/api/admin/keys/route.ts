import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const offset = (page - 1) * limit

    // 构建查询条件
    let countQuery = supabase.from('keys').select('*', { count: 'exact', head: true })
    let dataQuery = supabase.from('keys').select(`
      id,
      key_value,
      status,
      claimed_by_user_id,
      claimed_at,
      users!claimed_by_user_id(
        nickname,
        email
      )
    `)

    // 状态过滤
    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
    }

    // 搜索过滤
    if (search) {
      // 检查搜索内容是否为数字（用于用户ID搜索）
      const isNumeric = /^\d+$/.test(search)
      
      if (isNumeric) {
        // 如果是数字，同时搜索密钥值和用户ID
        countQuery = countQuery.or(`key_value.ilike.%${search}%,claimed_by_user_id.eq.${search}`)
        dataQuery = dataQuery.or(`key_value.ilike.%${search}%,claimed_by_user_id.eq.${search}`)
      } else {
        // 如果不是数字，只搜索密钥值和用户信息
        countQuery = countQuery.or(`key_value.ilike.%${search}%,users.nickname.ilike.%${search}%,users.email.ilike.%${search}%`)
        dataQuery = dataQuery.or(`key_value.ilike.%${search}%,users.nickname.ilike.%${search}%,users.email.ilike.%${search}%`)
      }
    }

    // 获取总数
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('获取密钥总数失败:', countError)
      return NextResponse.json({ success: false, error: '获取密钥总数失败' }, { status: 500 })
    }

    // 获取分页密钥及其领取人信息
    const { data: keys, error } = await dataQuery
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取密钥列表失败:', error)
      return NextResponse.json({ success: false, error: '获取密钥列表失败' }, { status: 500 })
    }

    // 处理密钥数据，添加用户信息
    const processedKeys = keys.map(key => ({
      ...key,
      user: key.users || null,
      users: undefined // 移除原始users数据
    }))

    return NextResponse.json({
      success: true,
      keys: processedKeys,
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('获取密钥列表失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { keyIds } = await request.json()

    if (!keyIds || !Array.isArray(keyIds) || keyIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择要删除的密钥' }, { status: 400 })
    }

    // 验证密钥ID是否为数字
    const validKeyIds = keyIds.filter(id => Number.isInteger(id) && id > 0)
    if (validKeyIds.length === 0) {
      return NextResponse.json({ success: false, error: '无效的密钥ID' }, { status: 400 })
    }

    // 删除密钥
    const { error } = await supabase
      .from('keys')
      .delete()
      .in('id', validKeyIds)

    if (error) {
      console.error('删除密钥失败:', error)
      return NextResponse.json({ success: false, error: '删除密钥失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `成功删除 ${validKeyIds.length} 个密钥`
    })
  } catch (error) {
    console.error('删除密钥失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}