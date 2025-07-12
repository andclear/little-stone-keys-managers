import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // 获取用户的所有点赞记录，包括粉丝牌编号
    const { data: likes, error } = await supabase
      .from('likes')
      .select('contributor_id, fan_badge_number')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user likes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user likes' },
        { status: 500 }
      )
    }

    return NextResponse.json(likes || [])
  } catch (error) {
    console.error('Error in GET /api/users/[id]/likes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}