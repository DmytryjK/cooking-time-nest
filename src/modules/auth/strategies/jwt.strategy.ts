import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@/modules/users/user.service';
import { config } from '@/config/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.accessSecret!,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersService.user({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
