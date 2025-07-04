import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, SendVerificationCodeDto, VerifyCodeDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-verification-code')
  async sendVerificationCode(@Body() sendVerificationCodeDto: SendVerificationCodeDto) {
    return this.authService.sendVerificationCode(sendVerificationCodeDto.email);
  }

  @Post('verify-code')
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    const isValid = await this.authService.verifyCode(verifyCodeDto.email, verifyCodeDto.code);
    return {
      success: true,
      message: '验证码验证成功',
      isValid,
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      registerDto.verificationCode,
    );
    return {
      success: true,
      message: '注册成功',
      data: result,
    };
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    const result = await this.authService.login(req.user);
    return {
      success: true,
      message: '登录成功',
      data: result,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    console.log('Profile request user:', req.user);
    return {
      success: true,
      data: req.user,
    };
  }

  @Post('logout')
  async logout() {
    return {
      success: true,
      message: '退出登录成功',
    };
  }

  // 测试用户快速注册（仅用于开发环境）
  @Post('quick-register')
  async quickRegister(@Body() body: { email: string; password: string; name: string }) {
    // 直接创建用户，跳过验证码
    const result = await this.authService.quickRegister(body.name, body.email, body.password);
    return {
      success: true,
      message: '快速注册成功',
      data: result,
    };
  }

  // 测试端点 - 检查JWT
  @Get('test-jwt')
  testJwt(@Request() req) {
    console.log('Headers:', req.headers);
    console.log('Authorization:', req.headers.authorization);
    return {
      success: true,
      message: '无认证测试成功',
      headers: req.headers,
    };
  }

  // 调试端点 - 查看所有用户
  @Get('debug-users')
  async debugUsers() {
    const users = await this.authService.getAllUsers();
    return {
      success: true,
      data: users.map(u => ({ id: u.id, email: u.email, name: u.name })),
    };
  }
}