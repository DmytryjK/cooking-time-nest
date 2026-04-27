import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { User, Prisma } from '@/generated/prisma/client';
import { Response, Request } from '@nestjs/common';
import { RecipesService } from '../recipes';
import { RecipeInteractionsFacade } from '../recipe-interactions/recipe-interactions.facade';
import { RecipeResponse } from '../recipes/types/recipe-response.type';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private recipeService: RecipesService,
    private recipeInteractionsFacade: RecipeInteractionsFacade,
  ) {}

  user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async toggleFavorite(
    userId: string,
    recipeId: string,
  ): Promise<RecipeResponse | null> {
    const favorite = await this.recipeInteractionsFacade.toggleFavorites(
      userId,
      recipeId,
    );

    const recipe = await this.recipeService.recipe(
      { id: recipeId },
      { ingredients: true, category: true, images: true },
    );

    return {
      ...recipe,
      isFavorite: favorite.isFavorite,
    };
  }
}
