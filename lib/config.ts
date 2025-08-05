export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  admin: {
    defaultUsername: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  },
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.qq.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    // 优化配置
    maxConcurrent: parseInt(process.env.EMAIL_MAX_CONCURRENT || '5'),
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
    connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT || '60000'),
    maxMessages: parseInt(process.env.EMAIL_MAX_MESSAGES || '100'),
  },
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5'),
  },
  app: {
    name: '皮皮伞 Keys 管理系统',
    version: '2.2.0',
    defaultApiBaseUrl: 'https://key.laopobao.online/v1',
  },
}

export type Config = typeof config