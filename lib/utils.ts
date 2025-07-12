import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

// 合并类名的工具函数
export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(' ')
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// 验证QQ号格式
export function isValidQQNumber(qq: string): boolean {
  const qqRegex = /^[1-9][0-9]{4,10}$/
  return qqRegex.test(qq)
}

// 生成邮箱验证码
export function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8)
}

// 生成随机密钥
export function generateRandomKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 格式化时间
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

// 验证邮箱格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证密码强度
export function isValidPassword(password: string): boolean {
  // 最低6位，不限制字符类型
  return password.length >= 6
}

// 验证验证码的辅助函数
export async function verifyCode(email: string, code: string): Promise<boolean> {
  try {
    // 先清理该邮箱的过期验证码
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email)
      .lt('expires_at', new Date().toISOString())
    
    // 查找有效的验证码
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      console.log('验证码不存在或已过期，邮箱:', email)
      return false
    }
    
    // 标记验证码为已使用
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', data.id)
    
    console.log('验证码验证成功，邮箱:', email)
    return true
  } catch (error) {
    console.error('验证码验证失败:', error)
    return false
  }
}

// 获取当前管理员信息
export function getCurrentAdmin() {
  if (typeof window === 'undefined') return null
  try {
    const adminData = localStorage.getItem('admin')
    return adminData ? JSON.parse(adminData) : null
  } catch (error) {
    console.error('获取管理员信息失败:', error)
    return null
  }
}

export const adminFetch = (url: string, options: RequestInit = {}) => {
  console.log('🔍 [DEBUG] adminFetch 被调用')
  console.log('🔍 [DEBUG] 请求URL:', url)
  console.log('🔍 [DEBUG] 请求选项:', options)
  
  const adminData = localStorage.getItem('admin')
  console.log('🔍 [DEBUG] 管理员数据存在:', !!adminData)
  
  if (!adminData) {
    console.error('🔍 [DEBUG] 管理员未登录')
    throw new Error('未登录')
  }

  const admin = JSON.parse(adminData)
  console.log('🔍 [DEBUG] 管理员信息:', { id: admin.id, username: admin.username })
  
  const requestOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'admin-data': adminData,
      ...options.headers,
    },
  }
  
  console.log('🔍 [DEBUG] 最终请求选项:', requestOptions)
  console.log('🔍 [DEBUG] 发送请求到:', url)
  
  return fetch(url, requestOptions).then(response => {
    console.log('🔍 [DEBUG] 收到响应:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    return response
  }).catch(error => {
    console.error('🔍 [DEBUG] 请求失败:', { url, error })
    throw error
  })
}