import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendVerificationCode } from '@/lib/email'
import { generateVerificationCode, isValidQQNumber } from '@/lib/utils'
import { config } from '@/lib/config'

// 验证码有效期（10分钟）
const CODE_EXPIRY = 10 * 60 * 1000

// 速率限制：每个IP每分钟最多发送指定次数验证码
const RATE_LIMIT_WINDOW = 60 * 1000 // 1分钟
const RATE_LIMIT_MAX_REQUESTS = config.rateLimit.maxRequests
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// 清理过期的速率限制记录
function cleanupRateLimit() {
  const now = Date.now()
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}

// 检查速率限制
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupRateLimit()
  
  const now = Date.now()
  const existing = rateLimitMap.get(ip)
  
  if (!existing) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW }
  }
  
  if (now > existing.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW }
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime }
  }
  
  existing.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count, resetTime: existing.resetTime }
}

export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP地址
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    
    // 检查速率限制
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      const resetTimeSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { 
          success: false, 
          message: `发送过于频繁，请${resetTimeSeconds}秒后再试` 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      )
    }

    const { qq } = await request.json()

    if (!qq || !isValidQQNumber(qq)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的QQ号' },
        { status: 400 }
      )
    }

    const email = `${qq}@qq.com`

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', parseInt(qq))
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '该QQ号已注册' },
        { status: 400 }
      )
    }

    // 生成验证码
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY)

    // 存储验证码到数据库
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString()
      })

    if (insertError) {
      console.error('验证码存储失败:', insertError)
      return NextResponse.json(
        { success: false, message: '验证码存储失败' },
        { status: 500 }
      )
    }

    // 发送邮件
    const emailResult = await sendVerificationCode(email, code)

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: emailResult.error || '邮件发送失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: '验证码已发送到您的QQ邮箱'
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    )
  } catch (error) {
    console.error('Send verification code error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}