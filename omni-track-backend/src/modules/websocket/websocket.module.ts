import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TaskWebSocketGateway } from './websocket.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  providers: [TaskWebSocketGateway],
  exports: [TaskWebSocketGateway],
})
export class WebSocketModule {}