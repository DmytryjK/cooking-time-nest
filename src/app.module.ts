import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './services/cloudinary';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { AuthModule } from './modules/auth/auth.module';
import { validate } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    CloudinaryModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RecipesModule,
  ],
})
export class AppModule {}
