import nodemailer from 'nodemailer'
import { config } from './config'

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: config.email.smtpHost,
  port: config.email.smtpPort,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.smtpUser,
    pass: config.email.smtpPass,
  },
})

// 发送验证码邮件
export async function sendVerificationCode(
  to: string,
  code: string
): Promise<boolean> {
  try {
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

    await transporter.sendMail(mailOptions)
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