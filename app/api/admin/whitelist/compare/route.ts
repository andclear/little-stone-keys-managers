import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { qqList } = await request.json()

    if (!qqList || !Array.isArray(qqList) || qqList.length === 0) {
      return NextResponse.json({ success: false, error: 'QQ号列表不能为空' }, { status: 400 })
    }

    // 验证QQ号格式
    const validQQs: string[] = []
    const invalidQQs: string[] = []
    
    for (const qq of qqList) {
      const trimmedQQ = qq.toString().trim()
      if (/^[1-9]\d{4,10}$/.test(trimmedQQ)) {
        validQQs.push(trimmedQQ)
      } else {
        invalidQQs.push(trimmedQQ)
      }
    }

    if (validQQs.length === 0) {
      return NextResponse.json({ 
        success: true,
        result: {
          inWhitelist: [],
          notInWhitelist: [],
          invalid: invalidQQs
        }
      })
    }

    // 查询所有白名单用户
    const { data: allWhitelistUsers, error: allWhitelistError } = await supabaseAdmin
      .from('whitelist')
      .select('qq_number')

    if (allWhitelistError) {
      console.error('查询白名单失败:', allWhitelistError)
      return NextResponse.json({ success: false, error: '查询白名单失败' }, { status: 500 })
    }

    const allWhitelistQQs = allWhitelistUsers?.map(user => user.qq_number.toString()) || []
    
    // 分析提供列表与白名单的关系
    const inWhitelist = validQQs.filter(qq => allWhitelistQQs.includes(qq))
    const notInWhitelist = validQQs.filter(qq => !allWhitelistQQs.includes(qq))
    const inWhitelistButNotInList = allWhitelistQQs.filter(qq => !validQQs.includes(qq))

    return NextResponse.json({
      success: true,
      result: {
        inWhitelist: inWhitelist,
        notInWhitelist: notInWhitelist,
        inWhitelistButNotInList: inWhitelistButNotInList,
        invalid: invalidQQs,
        summary: {
          totalProvided: validQQs.length,
          totalInWhitelist: allWhitelistQQs.length,
          matchCount: inWhitelist.length,
          missingFromWhitelist: notInWhitelist.length,
          extraInWhitelist: inWhitelistButNotInList.length
        }
      }
    })
  } catch (error) {
    console.error('对比QQ号失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}