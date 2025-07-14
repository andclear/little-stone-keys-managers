import nodemailer from 'nodemailer'
import { config } from './config'

// 邮件发送队列和并发控制
class EmailQueue {
  private queue: Array<() => Promise<void>> = []
  private processing = false
  private concurrentLimit = Math.min(config.email.maxConcurrent, 2) // 最大并发数，限制为2
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
      } catch (error: any) {
        lastError = error
        const errorCode = error.code || 'UNKNOWN'
        const errorMessage = error.message || 'Unknown error'
        
        if (attempt < this.maxRetries) {
          console.warn(`邮件发送失败，第${attempt}次重试，错误 [${errorCode}]:`, errorMessage)
          
          // 根据错误类型调整重试延迟
          let delay = this.retryDelay * attempt
          if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED') {
            delay = this.retryDelay * attempt * 2 // 连接问题增加延迟
          }
          
          await this.delay(delay)
        } else {
          console.error(`邮件发送最终失败 [${errorCode}]:`, errorMessage)
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
  secure: config.email.smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: config.email.smtpUser,
    pass: config.email.smtpPass,
  },
  // 连接池配置
  pool: true,
  maxConnections: Math.min(config.email.maxConcurrent, 3), // 限制最大连接数
  maxMessages: Math.min(config.email.maxMessages, 50), // 限制每连接最大消息数
  // 优化超时配置
  connectionTimeout: Math.min(config.email.connectionTimeout, 15000), // 最大15秒
  greetingTimeout: 10000,   // 10秒问候超时
  socketTimeout: Math.min(config.email.connectionTimeout, 15000), // 最大15秒
  // TLS配置
  requireTLS: true,
  tls: {
    rejectUnauthorized: false
  }
} as any)

// 发送验证码邮件（使用队列机制）
export async function sendVerificationCode(
  to: string,
  code: string
): Promise<{success: boolean, error?: string}> {
  try {
    const result = await emailQueue.add(async () => {
      // 先验证连接
      try {
        await transporter.verify()
      } catch (verifyError: any) {
        console.warn('SMTP连接验证失败，尝试继续发送:', verifyError.message)
      }
      
      const mailOptions = {
        from: `"${config.app.name}" <${config.email.smtpUser}>`,
        to,
        subject: '邮箱验证码 - 小石子 Keys 管理系统',
        text: `您的验证码是：${code}\n\n验证码有效期为 10 分钟。\n\n如果您没有请求此验证码，请忽略此邮件。\n此邮件由系统自动发送，请勿回复。`,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log('邮件发送成功:', { to, messageId: info.messageId })
      return info
    })
    
    return { success: true }
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN'
    const errorMessage = error.message || 'Unknown error'
    
    console.error(`邮件发送失败 [${errorCode}]:`, errorMessage)
    
    // 根据错误类型返回不同的错误信息
    let userFriendlyError = '邮件发送失败，请稍后重试'
    switch (errorCode) {
      case 'ETIMEDOUT':
        userFriendlyError = 'SMTP服务器连接超时，请检查网络连接'
        break
      case 'EAUTH':
        userFriendlyError = 'SMTP认证失败，请检查邮箱配置'
        break
      case 'ECONNREFUSED':
        userFriendlyError = 'SMTP服务器拒绝连接，请检查端口设置'
        break
      case 'ENOTFOUND':
        userFriendlyError = 'SMTP服务器地址无法解析'
        break
    }
    
    return { success: false, error: userFriendlyError }
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