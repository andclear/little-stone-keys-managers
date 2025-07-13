import nodemailer from 'nodemailer'
import { config } from './config'

// 邮件发送队列和并发控制
class EmailQueue {
  private queue: Array<() => Promise<void>> = []
  private processing = false
  private concurrentLimit = config.email.maxConcurrent // 最大并发数
  private activeJobs = 0
  private retryDelay = 1000 // 重试延迟（毫秒）
  private maxRetries = config.email.maxRetries // 最大重试次数

  async add<T>(job: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(job)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async executeWithRetry<T>(job: () => Promise<T>): Promise<T> {
    let lastError: any
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await job()
      } catch (error) {
        lastError = error
        if (attempt < this.maxRetries) {
          console.warn(`邮件发送失败，第${attempt}次重试，错误:`, error)
          await this.delay(this.retryDelay * attempt) // 指数退避
        }
      }
    }
    throw lastError
  }

  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0 && this.activeJobs < this.concurrentLimit) {
      const job = this.queue.shift()
      if (job) {
        this.activeJobs++
        job().finally(() => {
          this.activeJobs--
          this.process() // 继续处理队列
        })
      }
    }

    if (this.queue.length === 0 && this.activeJobs === 0) {
      this.processing = false
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 创建全局邮件队列实例
const emailQueue = new EmailQueue()

// 创建邮件传输器（优化配置）
const transporter = nodemailer.createTransport({
  host: config.email.smtpHost,
  port: config.email.smtpPort,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.smtpUser,
    pass: config.email.smtpPass,
  },
  // 连接池配置
  pool: true,
  maxConnections: config.email.maxConcurrent,
  maxMessages: config.email.maxMessages,
  // 超时配置
  connectionTimeout: config.email.connectionTimeout,
  greetingTimeout: 30000,   // 30秒
  socketTimeout: config.email.connectionTimeout
} as any)

// 发送验证码邮件（使用队列机制）
export async function sendVerificationCode(
  to: string,
  code: string
): Promise<boolean> {
  try {
    const result = await emailQueue.add(async () => {
      const mailOptions = {
        from: `"${config.app.name}" <${config.email.smtpUser}>`,
        to,
        subject: '邮箱验证码 - 小石子 Keys 管理系统',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">${config.app.name}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">邮箱验证码</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <h2 style="color: #333; margin: 0 0 20px 0;">您的验证码</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 2px dashed #667eea; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #666; margin: 20px 0 0 0; font-size: 14px;">验证码有效期为 10 分钟</p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>如果您没有请求此验证码，请忽略此邮件。</p>
              <p>此邮件由系统自动发送，请勿回复。</p>
            </div>
          </div>
        `,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log('邮件发送成功:', { to, messageId: info.messageId })
      return info
    })
    
    return true
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}

// 验证邮件服务是否可用
export async function verifyEmailService(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error('Email service verification failed:', error)
    return false
  }
}