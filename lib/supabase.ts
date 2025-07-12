import { createClient } from '@supabase/supabase-js'
import { config } from './config'

if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 客户端使用anon key
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
)

// 管理端使用service role key
export const supabaseAdmin = createClient(
  config.supabase.url,
  process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabase.anonKey,
  {
    db: {
      schema: 'public'
    }
  }
)

// 数据库表类型定义
export interface User {
  id: number // QQ号
  nickname: string
  email: string
  password_hash: string
  is_banned: boolean
  created_at: string
}

export interface Key {
  id: number
  key_value: string
  status: 'unclaimed' | 'claimed' | 'void'
  claimed_by_user_id?: number
  claimed_at?: string
}

export interface Contributor {
  id: number
  nickname: string
  avatar_url: string
  points: number
  likes_count: number
  created_at: string
}

export interface Like {
  user_id: number
  contributor_id: number
  fan_badge_number?: number
  created_at: string
}

export interface Admin {
  id: number
  username: string
  password_hash: string
  created_at: string
}

export interface AuditLog {
  id: number
  admin_id: number
  action: string
  created_at: string
}

// 用户明确要求：白名单管理不使用id参数，只需要QQ号和创建时间
export interface Whitelist {
  qq_number: number
  created_at: string
}

export interface SystemConfig {
  id: number
  key: string
  value: string
  updated_at: string
}