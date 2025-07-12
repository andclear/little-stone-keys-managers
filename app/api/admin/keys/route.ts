import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 获取所有密钥及其领取人信息
    const { data: keys, error } = await supabase
      .from('keys')
      .select(`
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
      .order('id', { ascending: false })

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
      keys: processedKeys
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