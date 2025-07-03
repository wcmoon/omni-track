import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;
}

export class RegisterDto {
  @IsString({ message: '姓名不能为空' })
  @MinLength(2, { message: '姓名至少需要2个字符' })
  @MaxLength(50, { message: '姓名不能超过50个字符' })
  name: string;

  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(128, { message: '密码不能超过128个字符' })
  password: string;

  @IsString({ message: '验证码不能为空' })
  @MinLength(6, { message: '验证码为6位数字' })
  @MaxLength(6, { message: '验证码为6位数字' })
  verificationCode: string;
}

export class SendVerificationCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;
}

export class VerifyCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString({ message: '验证码不能为空' })
  @MinLength(6, { message: '验证码为6位数字' })
  @MaxLength(6, { message: '验证码为6位数字' })
  code: string;
}