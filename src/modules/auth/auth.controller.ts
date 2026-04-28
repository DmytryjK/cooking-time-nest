import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, AuthResponseDto } from './dto';
import {
  ErrorResponseDto,
  UnauthorizedResponseDto,
  ConflictResponseDto,
} from '@/common/dto';
import { CurrentUser } from './decorators';
import { JwtAuthGuard } from './guards';
import { type UserModel } from '@/generated/prisma/models';
import { type Response, type Request } from 'express';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { config } from '@/config/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
    type: ConflictResponseDto,
  })
  signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signup(signupDto, res);
  }

  @Post('sign-in')
  @ApiOperation({
    summary: 'Login to the system',
    description: 'Authenticate user and receive JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: UnauthorizedResponseDto,
  })
  login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Post('sign-out')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Logout from the system',
    description: 'Logout user and remove JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: UnauthorizedResponseDto,
  })
  logout(
    @CurrentUser() user: UserModel,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(user.id, res);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refresh access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: UnauthorizedResponseDto,
  })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request & { user: { email: string; name: string } },
    @Res() res: Response,
  ) {
    await this.authService.googleLogin(req.user, res);
    res.redirect(config.googleRedirectUrl!);
  }
}
