import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/user.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@/generated/prisma/client';
import { PrismaService } from '@/database/prisma';
import { type Response, type Request } from 'express';
import { config } from '@/config/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  private async issueToken(user: User, res: Response) {
    const payload = { email: user.email, sub: user.id };
    const refreshExpiresMs = config.jwt.refreshExpiresMs;

    const accessToken = this.jwtService.sign(payload, {
      secret: config.jwt.accessSecret,
      expiresIn: config.jwt.accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: config.jwt.refreshSecret,
      expiresIn: config.jwt.refreshExpiresIn,
    });

    await this.prismaService.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await this.prismaService.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: +refreshExpiresMs,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async signup(signupDto: SignupDto, res: Response) {
    const { email, password, name } = signupDto;

    const existingUser = await this.usersService.user({ email });
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      name,
    });

    return this.issueToken(user, res);
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    const user = await this.usersService.user({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(user, res);
  }

  async logout(userId: string, res: Response) {
    await this.prismaService.refreshToken.deleteMany({ where: { userId } });
    res.clearCookie('refreshToken');
    return { message: 'Successfully logged out' };
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies['refreshToken'] as string | undefined;
    console.log(req.cookies, 'req.cookies');
    if (!token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: config.jwt.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const saved = await this.prismaService.refreshToken.findFirst({
      where: { userId: payload.sub, token },
    });

    if (!saved) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (saved.isUsed) {
      await this.prismaService.refreshToken.deleteMany({
        where: { userId: payload.sub },
      });
      res.clearCookie('refreshToken');
      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked',
      );
    }

    await this.prismaService.refreshToken.update({
      where: { id: saved.id },
      data: { isUsed: true },
    });

    const user = await this.usersService.user({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueToken(user, res);
  }

  async googleLogin(
    googleUser: { email: string; name: string },
    res: Response,
  ) {
    let user = await this.usersService.user({ email: googleUser.email });

    if (!user) {
      user = await this.usersService.createUser({
        email: googleUser.email,
        name: googleUser.name,
        password: '',
      });
    }

    return this.issueToken(user, res);
  }
}
