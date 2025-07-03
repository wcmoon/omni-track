import { Controller, Get } from '@nestjs/common';
import Credential from '@alicloud/credentials';

@Controller('test')
export class TestCredentialsController {
  @Get('aliyun-credentials')
  async testAliyunCredentials() {
    console.log('=== Environment Variables Debug ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('ALIBABA_CLOUD_ACCESS_KEY_ID:', process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ? `${process.env.ALIBABA_CLOUD_ACCESS_KEY_ID.substring(0, 8)}***` : 'NOT SET');
    console.log('ALIBABA_CLOUD_ACCESS_KEY_SECRET:', process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET ? '***SET***' : 'NOT SET');
    console.log('ALIYUN_MAIL_ACCOUNT:', process.env.ALIYUN_MAIL_ACCOUNT);
    console.log('====================================');

    try {
      const credential = new Credential();
      const cred = await credential.getCredential();
      
      return {
        success: true,
        message: 'Credentials loaded successfully',
        data: {
          accessKeyId: cred.accessKeyId ? `${cred.accessKeyId.substring(0, 8)}***` : 'Not found',
          accessKeySecret: cred.accessKeySecret ? '***hidden***' : 'Not found',
          credentialType: cred.type || 'Unknown',
        },
        environmentVariables: {
          ALIBABA_CLOUD_ACCESS_KEY_ID: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ? `${process.env.ALIBABA_CLOUD_ACCESS_KEY_ID.substring(0, 8)}***` : 'Not set',
          ALIBABA_CLOUD_ACCESS_KEY_SECRET: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET ? 'Set' : 'Not set',
          ALICLOUD_ACCESS_KEY: process.env.ALICLOUD_ACCESS_KEY ? 'Set' : 'Not set',
          ALICLOUD_SECRET_KEY: process.env.ALICLOUD_SECRET_KEY ? 'Set' : 'Not set',
          ALIYUN_MAIL_ACCOUNT: process.env.ALIYUN_MAIL_ACCOUNT || 'Not set',
          ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
            key.includes('ALIBABA') || 
            key.includes('ALICLOUD') || 
            key.includes('ALIYUN')
          ),
        }
      };
    } catch (error: any) {
      console.error('Credential error:', error);
      return {
        success: false,
        message: 'Failed to load credentials',
        error: error.message,
        stack: error.stack,
        environmentVariables: {
          ALIBABA_CLOUD_ACCESS_KEY_ID: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ? `${process.env.ALIBABA_CLOUD_ACCESS_KEY_ID.substring(0, 8)}***` : 'Not set',
          ALIBABA_CLOUD_ACCESS_KEY_SECRET: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET ? 'Set' : 'Not set',
          ALICLOUD_ACCESS_KEY: process.env.ALICLOUD_ACCESS_KEY ? 'Set' : 'Not set',
          ALICLOUD_SECRET_KEY: process.env.ALICLOUD_SECRET_KEY ? 'Set' : 'Not set',
          ALIYUN_MAIL_ACCOUNT: process.env.ALIYUN_MAIL_ACCOUNT || 'Not set',
          ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
            key.includes('ALIBABA') || 
            key.includes('ALICLOUD') || 
            key.includes('ALIYUN')
          ),
        }
      };
    }
  }
}