import { Injectable } from '@nestjs/common';
import Dm20151123, * as $Dm20151123 from '@alicloud/dm20151123';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import Util, * as $Util from '@alicloud/tea-util';
import Credential from '@alicloud/credentials';

@Injectable()
export class EmailService {
  private client: Dm20151123;

  constructor() {
    this.client = this.createClient();
  }

  private createClient(): Dm20151123 {
    // 使用默认环境变量方式获取凭据
    const credential = new Credential();
    
    // 验证凭据是否正确加载
    credential.getCredential().then(cred => {
      console.log('✅ Aliyun credentials loaded successfully');
      console.log('📧 Email service ready');
    }).catch(err => {
      console.error('❌ Failed to get Aliyun credentials:', err.message);
    });

    const config = new $OpenApi.Config({
      credential: credential,
    });
    config.endpoint = 'dm.aliyuncs.com';
    return new Dm20151123(config);
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    console.log(`Attempting to send verification code to: ${email}`);
    
    const singleSendMailRequest = new $Dm20151123.SingleSendMailRequest({
      accountName: process.env.ALIYUN_MAIL_ACCOUNT || 'noreply@mail.timeweave.xyz',
      addressType: 1,
      replyToAddress: false,
      toAddress: email,
      subject: 'TimeWeave 邮箱验证码',
      htmlBody: this.getVerificationEmailTemplate(code),
      textBody: `您的验证码是 ${code}，有效期10分钟，请勿分享给他人。`,
    });

    const runtime = new $Util.RuntimeOptions({});

    try {
      const response = await this.client.singleSendMailWithOptions(singleSendMailRequest, runtime);
      console.log('Email sent successfully:', response);
      return true;
    } catch (error: any) {
      console.error('Failed to send verification email:');
      console.error('Error message:', error?.message || error);
      console.error('Error code:', error?.code);
      console.error('Error data:', error?.data);
      
      // 如果是凭据问题，输出更详细的信息
      if (error?.code === 'InvalidAccessKeyId' || error?.code === 'SignatureDoesNotMatch') {
        console.error('Credentials issue detected. Please check your environment variables:');
        console.error('- ALIBABA_CLOUD_ACCESS_KEY_ID');
        console.error('- ALIBABA_CLOUD_ACCESS_KEY_SECRET');
        console.error('- Or ALICLOUD_ACCESS_KEY and ALICLOUD_SECRET_KEY');
      }
      
      return false;
    }
  }

  private getVerificationEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>TimeWeave 邮箱验证</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 40px 30px; text-align: center; }
          .logo { color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
          .content { padding: 40px 30px; }
          .code-box { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
          .footer { padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">TimeWeave</div>
            <div class="subtitle">智能多维记录系统</div>
          </div>
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">验证您的邮箱地址</h2>
            <p style="color: #666; line-height: 1.6;">感谢您注册 TimeWeave！请使用以下验证码完成邮箱验证：</p>
            <div class="code-box">
              <div style="font-size: 16px; margin-bottom: 10px;">您的验证码</div>
              <div class="code">${code}</div>
              <div style="font-size: 14px; margin-top: 10px;">有效期：10分钟</div>
            </div>
            <p style="color: #666; line-height: 1.6;">
              请在注册页面输入此验证码完成验证。如果您没有请求此验证码，请忽略此邮件。
            </p>
            <p style="color: #666; line-height: 1.6;">
              为了您的账户安全，请勿将验证码分享给他人。
            </p>
          </div>
          <div class="footer">
            <p>此邮件由 TimeWeave 系统自动发送，请勿回复。</p>
            <p style="margin-top: 10px;">© 2025 TimeWeave. 版权所有</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}