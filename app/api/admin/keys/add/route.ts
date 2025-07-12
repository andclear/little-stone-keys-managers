import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { keys } = await request.json()

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ success: false, error: '密钥列表不能为空' }, { status: 400 })
    }

    // 过滤空值和重复值
    const uniqueKeys = Array.from(new Set(keys.filter(key => key && key.trim())))
    
    if (uniqueKeys.length === 0) {
      return NextResponse.json({ success: false, error: '没有有效的密钥' }, { status: 400 })
    }

    // 检查哪些密钥已经存在
    const { data: existingKeys, error: checkError } = await supabase
      .from('keys')
      .select('key_value')
      .in('key_value', uniqueKeys)

    if (checkError) {
      console.error('检查密钥重复失败:', checkError)
      return NextResponse.json({ success: false, error: '检查密钥重复失败' }, { status: 500 })
    }

    const existingKeyValues = existingKeys.map(k => k.key_value)
    const newKeys = uniqueKeys.filter(key => !existingKeyValues.includes(key))

    let addedCount = 0
    if (newKeys.length > 0) {
      // 批量插入新密钥
      const keysToInsert = newKeys.map(key => ({
        key_value: key,
        status: 'unclaimed'
      }))

      const { error: insertError } = await supabase
        .from('keys')
        .insert(keysToInsert)

      if (insertError) {
        console.error('插入密钥失败:', insertError)
        return NextResponse.json({ success: false, error: '添加密钥失败' }, { status: 500 })
      }

      addedCount = newKeys.length
    }

    // 记录操作日志
    try {
      const adminData = request.headers.get('admin-data')
      let adminId = 1 // 默认管理员ID
      
      if (adminData) {
        const admin = JSON.parse(adminData)
        adminId = admin.id
      }

      await supabase
        .from('audit_logs')
        .insert({
          admin_id: adminId,
          action: `批量添加密钥 ${addedCount} 个，重复跳过 ${existingKeyValues.length} 个`
        })
    } catch (logError) {
      console.error('记录日志失败:', logError)
    }

    return NextResponse.json({
      success: true,
      addedCount,
      duplicateCount: existingKeyValues.length,
      message: `成功添加 ${addedCount} 个密钥${existingKeyValues.length > 0 ? `，跳过 ${existingKeyValues.length} 个重复密钥` : ''}`
    })
  } catch (error) {
    console.error('批量添加密钥失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}