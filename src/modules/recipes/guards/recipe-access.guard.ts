import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RecipesService } from '../recipe.service';
import { User } from '@/generated/prisma/client';

@Injectable()
export class RecipeAccessGuard implements CanActivate {
  constructor(private recipesService: RecipesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const recipeId: string = request.params.id;
    const currentUser = request.user as User | undefined;
    const isAdmin = currentUser?.role === 'admin';

    if (!recipeId) {
      throw new NotFoundException('Invalid recipe ID');
    }

    // Загружаем рецепт
    const recipe = await this.recipesService.recipe({ id: recipeId });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Если рецепт гостевой (userId = null), разрешаем всем
    if (recipe.userId === null) {
      return true;
    }

    // Если рецепт принадлежит пользователю, проверяем авторство
    if (!currentUser) {
      throw new ForbiddenException('You must be logged in to edit this recipe');
    }

    if (!isAdmin && recipe.userId !== currentUser.id) {
      throw new ForbiddenException('You can only edit your own recipes');
    }

    return true;
  }
}
