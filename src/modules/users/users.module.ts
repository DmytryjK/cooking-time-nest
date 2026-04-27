import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { RecipesModule } from '../recipes';
import { RecipeInteractionsModule } from '../recipe-interactions/recipe-interactions.module';

@Module({
  imports: [RecipesModule, RecipeInteractionsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
