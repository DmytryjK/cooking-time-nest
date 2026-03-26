import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators';
import { type User as UserModel } from '@/generated/prisma/client';
import { UserResponseDto } from './dto';
import { UnauthorizedResponseDto } from '@/common/dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user information',
    description: 'Retrieve authenticated user information (excluding password)',
  })
  @ApiResponse({
    status: 200,
    description: 'User information',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  getMe(@CurrentUser() user: UserModel): Omit<UserModel, 'password'> {
    return user;
  }
}
