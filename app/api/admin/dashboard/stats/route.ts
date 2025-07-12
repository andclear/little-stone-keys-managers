import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // 获取用户统计
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: bannedUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_banned', true)

    // 获取密钥统计
    const { count: totalKeys } = await supabaseAdmin
      .from('keys')
      .select('*', { count: 'exact', head: true })

    const { count: unclaimedKeys } = await supabaseAdmin
      .from('keys')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unclaimed')

    const { count: claimedKeys } = await supabaseAdmin
      .from('keys')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'claimed')

    const { count: voidKeys } = await supabaseAdmin
      .from('keys')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'void')

    // 获取贡献者统计
    const { count: totalContributors } = await supabaseAdmin
      .from('contributors')
      .select('*', { count: 'exact', head: true })

    // 获取点赞统计
    const { count: totalLikes } = await supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })

    const stats = {
      totalUsers: totalUsers || 0,
      bannedUsers: bannedUsers || 0,
      totalKeys: totalKeys || 0,
      unclaimedKeys: unclaimedKeys || 0,
      claimedKeys: claimedKeys || 0,
      voidKeys: voidKeys || 0,
      totalContributors: totalContributors || 0,
      totalLikes: totalLikes || 0,
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { success: false, message: '获取统计数据失败' },
      { status: 500 }
    )
  }
}