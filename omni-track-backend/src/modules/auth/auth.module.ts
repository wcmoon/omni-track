import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TestCredentialsController } from './test-credentials.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailService } from './email.service';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'wcn4911.',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController, TestCredentialsController],
  providers: [AuthService, LocalStrategy, JwtStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}