import { ConfigService } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  apiPrefix: string;
}

export const getAppConfig = (configService: ConfigService): AppConfig => ({
  port: configService.get<number>('PORT', 3001),
  nodeEnv: configService.get<string>('NODE_ENV', 'development'),
  corsOrigins: configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
  apiPrefix: configService.get<string>('API_PREFIX', 'api'),
});