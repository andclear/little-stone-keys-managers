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
  },
  app: {
    name: '小石子 Keys 管理系统',
    version: '2.2.0',
    defaultApiBaseUrl: 'https://api.xiaoshizi.com/v1',
  },
}

export type Config = typeof config