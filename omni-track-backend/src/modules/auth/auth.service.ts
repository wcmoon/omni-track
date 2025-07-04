import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { EmailService } from './email.service';
import { User } from '../../database/entities/user.entity';

interface VerificationCode {
  code: string;
  email: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private verificationCodes = new Map<string, VerificationCode>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {
    // 每5分钟清理一次过期验证码
    setInterval(() => this.cleanupExpiredCodes(), 5 * 60 * 1000);
  }

  async validateUser(email: string, password: string): Promise<any> {
    console.log('Validating user:', email, 'with password:', password);
    const user = await this.userRepository.findOne({ where: { email } });
    console.log('Found user:', user ? { id: user.id, email: user.email, hasPassword: !!user.password } : 'null');
    
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', passwordMatch);
      if (passwordMatch) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    console.log('Signing JWT token with payload:', payload);
    console.log('Generated token:', token);
    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
      },
    };
  }

  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    // 检查邮箱是否已注册
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 生成验证码
    const code = this.emailService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 存储验证码
    this.verificationCodes.set(email, {
      code,
      email,
      expiresAt,
    });

    // 发送邮件
    const success = await this.emailService.sendVerificationCode(email, code);
    
    if (success) {
      return {
        success: true,
        message: '验证码已发送到您的邮箱，请查收',
      };
    } else {
      throw new BadRequestException('验证码发送失败，请稍后重试');
    }
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const stored = this.verificationCodes.get(email);
    
    if (!stored) {
      throw new BadRequestException('验证码不存在或已过期');
    }

    if (stored.expiresAt < new Date()) {
      this.verificationCodes.delete(email);
      throw new BadRequestException('验证码已过期');
    }

    if (stored.code !== code) {
      throw new BadRequestException('验证码错误');
    }

    return true;
  }

  async register(name: string, email: string, password: string, verificationCode: string): Promise<any> {
    // 验证邮箱验证码
    await this.verifyCode(email, verificationCode);

    // 检查邮箱是否已注册
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      subscriptionTier: 'free',
      maxProjects: 3,
      maxLogEntries: 100,
    });

    const savedUser = await this.userRepository.save(newUser);

    // 清除验证码
    this.verificationCodes.delete(email);

    // 生成JWT令牌
    const { password: _, ...userWithoutPassword } = savedUser;
    return this.login(userWithoutPassword);
  }

  async findUserById(id: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { id } });
  }

  // 调试方法 - 获取所有用户
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  // 快速注册（跳过验证码，仅用于测试）
  async quickRegister(name: string, email: string, password: string): Promise<any> {
    // 检查邮箱是否已注册
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      subscriptionTier: 'free',
      maxProjects: 3,
      maxLogEntries: 100,
    });

    const savedUser = await this.userRepository.save(newUser);

    // 生成JWT令牌
    const { password: _, ...userWithoutPassword } = savedUser;
    return this.login(userWithoutPassword);
  }

  // 清理过期的验证码
  private cleanupExpiredCodes() {
    const now = new Date();
    for (const [email, verification] of this.verificationCodes.entries()) {
      if (verification.expiresAt < now) {
        this.verificationCodes.delete(email);
      }
    }
  }
}