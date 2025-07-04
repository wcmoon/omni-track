import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    const secret = process.env.JWT_SECRET || 'wcn4911.';
    console.log('JWT Strategy initialized with secret:', secret);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload);
    try {
      const user = await this.authService.findUserById(payload.sub);
      console.log('Found User:', user);
      if (!user) {
        console.log('User not found for ID:', payload.sub);
        return null;
      }
      return { id: user.id, email: user.email, name: user.name };
    } catch (error) {
      console.error('JWT validation error:', error);
      return null;
    }
  }
}