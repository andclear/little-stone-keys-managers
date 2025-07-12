import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端，优先使用服务角色密钥，否则使用匿名密钥
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, contributorId } = await request.json()

    if (!userId || !contributorId) {
      return NextResponse.json(
        { success: false, message: '用户ID和贡献者ID不能为空' },
        { status: 400 }
      )
    }

    // 检查用户是否存在且未被封禁
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_banned')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    if (user.is_banned) {
      return NextResponse.json(
        { success: false, message: '账户已被封禁，无法进行点赞操作' },
        { status: 403 }
      )
    }

    // 检查贡献者是否存在
    const { data: contributor, error: contributorError } = await supabase
      .from('contributors')
      .select('id')
      .eq('id', contributorId)
      .single()

    if (contributorError || !contributor) {
      return NextResponse.json(
        { success: false, message: '贡献者不存在' },
        { status: 404 }
      )
    }

    // 检查是否已经点赞
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .eq('contributor_id', contributorId)
      .single()

    if (existingLike) {
      // 已经点赞过，不允许取消点赞
      return NextResponse.json({
        success: false,
        message: '您已经为该贡献者点过赞了',
        liked: true
      })
    } else {
      // 获取该贡献者当前最大的粉丝牌编号
      const { data: maxBadgeData } = await supabase
        .from('likes')
        .select('fan_badge_number')
        .eq('contributor_id', contributorId)
        .not('fan_badge_number', 'is', null)
        .order('fan_badge_number', { ascending: false })
        .limit(1)
        .single()

      let nextBadgeNumber = 1
      if (maxBadgeData && maxBadgeData.fan_badge_number) {
        nextBadgeNumber = maxBadgeData.fan_badge_number + 1
      }

      // 检查是否超过999的限制
      if (nextBadgeNumber > 999) {
        return NextResponse.json({
          success: false,
          message: '该贡献者的粉丝牌已发放完毕（最多999个）'
        })
      }

      // 添加点赞
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          contributor_id: contributorId,
          fan_badge_number: nextBadgeNumber,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Insert like error:', insertError)
        return NextResponse.json(
          { success: false, message: '点赞失败' },
          { status: 500 }
        )
      }

      // 更新贡献者点赞数
      const { error: updateError } = await supabase
        .rpc('increment_likes_count', { contributor_id: contributorId })

      if (updateError) {
        console.error('Update likes count error:', updateError)
        // 如果函数调用失败，先获取当前点赞数再更新
        const { data: currentData } = await supabase
          .from('contributors')
          .select('likes_count')
          .eq('id', contributorId)
          .single()
        
        if (currentData) {
           const { error: directUpdateError } = await supabase
             .from('contributors')
             .update({ likes_count: currentData.likes_count + 1 })
             .eq('id', contributorId)
           
           if (directUpdateError) {
             console.error('Direct update likes count error:', directUpdateError)
           }
         }
      }

      return NextResponse.json({
        success: true,
        message: '点赞成功',
        liked: true,
        fanBadgeNumber: nextBadgeNumber
      })
    }
  } catch (error) {
    console.error('Toggle like error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}