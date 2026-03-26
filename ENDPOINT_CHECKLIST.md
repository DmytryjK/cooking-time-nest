# 📋 Чек-лист создания нового эндпоинта в NestJS

## 🏗️ Архитектура NestJS

```
HTTP Request → Controller → Service → Prisma → Database
                    ↓           ↓
                   DTO     Business Logic
```

---

## ✅ Пошаговый чек-лист

### 1️⃣ Планирование

- [ ] Определить HTTP метод (GET, POST, PUT, PATCH, DELETE)
- [ ] Определить путь эндпоинта (например: `/recipes/:id/ingredients`)
- [ ] Определить какие данные принимает (body, params, query)
- [ ] Определить какие данные возвращает
- [ ] Нужна ли аутентификация?

---

### 2️⃣ Создание DTO (если нужно)

**Для POST, PUT, PATCH запросов:**

- [ ] Создать файл DTO: `src/modules/[module]/dto/[name].dto.ts`
- [ ] Импортировать валидаторы: `class-validator`
- [ ] Добавить декораторы валидации для каждого поля
- [ ] Добавить `@ApiProperty()` для Swagger документации

**Пример:**
```typescript
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name', example: 'Pizza' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
```

**Для GET запросов DTO обычно не нужен!**

---

### 3️⃣ Добавление метода в Service

- [ ] Открыть файл `[module].service.ts`
- [ ] Создать новый async метод
- [ ] Добавить бизнес-логику
- [ ] Добавить запрос к БД через Prisma
- [ ] Указать тип возвращаемого значения

**Пример:**
```typescript
// recipe.service.ts
async getRecipeById(id: number): Promise<Recipe | null> {
  return this.prisma.recipe.findUnique({
    where: { id },
  });
}

async createRecipe(data: Prisma.RecipeCreateInput): Promise<Recipe> {
  return this.prisma.recipe.create({
    data,
  });
}
```

---

### 4️⃣ Добавление эндпоинта в Controller

- [ ] Открыть файл `[module].controller.ts`
- [ ] Добавить декоратор HTTP метода: `@Get()`, `@Post()`, и т.д.
- [ ] Добавить путь в декоратор (если нужно): `@Get(':id')`
- [ ] Добавить декораторы для Swagger:
  - [ ] `@ApiOperation()` - описание эндпоинта
  - [ ] `@ApiResponse()` - возможные ответы
  - [ ] `@ApiParam()` / `@ApiQuery()` - параметры (если есть)
- [ ] Добавить Guard если нужна аутентификация: `@UseGuards(JwtAuthGuard)`
- [ ] Создать метод контроллера
- [ ] Извлечь данные из запроса:
  - [ ] `@Param('id')` - для параметров URL
  - [ ] `@Body()` - для тела запроса
  - [ ] `@Query('search')` - для query параметров
  - [ ] `@CurrentUser()` - для текущего пользователя
- [ ] Вызвать метод сервиса
- [ ] Вернуть результат

**Пример GET:**
```typescript
@Get(':id')
@ApiOperation({ summary: 'Get recipe by ID' })
@ApiParam({ name: 'id', description: 'Recipe ID', example: '1' })
@ApiResponse({ status: 200, description: 'Recipe found' })
@ApiResponse({ status: 404, description: 'Recipe not found' })
async getRecipeById(@Param('id') id: string): Promise<Recipe | null> {
  return this.recipeService.getRecipeById(Number(id));
}
```

**Пример POST:**
```typescript
@Post()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Create a new recipe' })
@ApiResponse({ status: 201, description: 'Recipe created' })
@ApiResponse({ status: 400, description: 'Invalid data' })
async createRecipe(
  @Body() createRecipeDto: CreateRecipeDto,
  @CurrentUser() user: UserModel,
): Promise<Recipe> {
  const { title, description } = createRecipeDto;

  return this.recipeService.createRecipe({
    title,
    description,
    user: { connect: { id: user.id } },
  });
}
```

---

### 5️⃣ Тестирование

- [ ] Запустить приложение: `npm run start:dev`
- [ ] Открыть Postman / Thunder Client / Insomnia
- [ ] Протестировать эндпоинт с корректными данными
- [ ] Протестировать с некорректными данными (валидация)
- [ ] Проверить ответы (статус коды, структура данных)
- [ ] Проверить Swagger UI: `http://localhost:3000/api`

---

## 🎯 Декораторы - Шпаргалка

### Извлечение данных из запроса

| Декоратор | Что извлекает | Пример |
|-----------|---------------|--------|
| `@Param('id')` | Параметры URL | `/recipes/:id` → `123` |
| `@Body()` | Тело запроса (JSON) | POST body |
| `@Query('search')` | Query параметры | `?search=pizza` → `"pizza"` |
| `@Headers('auth')` | HTTP заголовки | `Authorization` |
| `@CurrentUser()` | Текущий пользователь | Custom decorator |

### HTTP методы

| Декоратор | Назначение | Когда использовать |
|-----------|------------|-------------------|
| `@Get()` | Чтение | Получение данных |
| `@Post()` | Создание | Создание новой записи |
| `@Put()` | Полное обновление | Замена всей записи |
| `@Patch()` | Частичное обновление | Обновление части полей |
| `@Delete()` | Удаление | Удаление записи |

### Валидация (в DTO)

| Декоратор | Проверка | Пример |
|-----------|----------|--------|
| `@IsString()` | Строка | `"hello"` ✅ `123` ❌ |
| `@IsNumber()` | Число | `123` ✅ `"123"` ❌ |
| `@IsEmail()` | Email | `test@mail.com` ✅ |
| `@IsNotEmpty()` | Не пустое | `""` ❌ `null` ❌ |
| `@IsOptional()` | Опциональное поле | Может отсутствовать |
| `@Min(0)` / `@Max(100)` | Диапазон чисел | `50` ✅ `-10` ❌ |
| `@IsArray()` | Массив | `[]` ✅ `{}` ❌ |
| `@ArrayMinSize(1)` | Минимум элементов | `[1, 2]` ✅ `[]` ❌ |
| `@ValidateNested()` | Вложенная валидация | Для массива объектов |
| `@IsEnum(MyEnum)` | Значение из enum | `"ACTIVE"` ✅ `"INVALID"` ❌ |

### Аутентификация и Guard'ы

| Декоратор | Назначение |
|-----------|-----------|
| `@UseGuards(JwtAuthGuard)` | Требует JWT токен (обязательно) |
| `@UseGuards(OptionalJwtAuthGuard)` | JWT токен опционален |
| `@UseGuards(RolesGuard)` | Проверка ролей пользователя |
| `@ApiBearerAuth('JWT-auth')` | Swagger: показывает что нужна аутентификация |

### Swagger документация

| Декоратор | Назначение |
|-----------|-----------|
| `@ApiTags('Recipes')` | Группа эндпоинтов в Swagger |
| `@ApiOperation({ summary: '...' })` | Описание эндпоинта |
| `@ApiResponse({ status: 200 })` | Описание ответа |
| `@ApiParam({ name: 'id' })` | Описание параметра URL |
| `@ApiQuery({ name: 'search' })` | Описание query параметра |
| `@ApiProperty()` | Описание поля в DTO |

---

## 🔄 Типичные паттерны

### GET с параметром
```typescript
@Get(':id')
async getById(@Param('id') id: string) {
  return this.service.findOne(Number(id));
}
```

### GET с query параметрами
```typescript
@Get()
async getAll(
  @Query('search') search?: string,
  @Query('limit') limit?: number,
) {
  return this.service.findAll({ search, limit });
}
```

### POST с валидацией
```typescript
@Post()
@UseGuards(JwtAuthGuard)
async create(
  @Body() dto: CreateDto,
  @CurrentUser() user: User,
) {
  return this.service.create(dto, user.id);
}
```

### PUT/PATCH с ID
```typescript
@Patch(':id')
@UseGuards(JwtAuthGuard)
async update(
  @Param('id') id: string,
  @Body() dto: UpdateDto,
) {
  return this.service.update(Number(id), dto);
}
```

### DELETE
```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard)
async delete(@Param('id') id: string) {
  return this.service.delete(Number(id));
}
```

---

## ⚠️ Частые ошибки

### 1. Забыли добавить валидационные декораторы в DTO
```typescript
// ❌ Плохо - валидация не работает
export class CreateDto {
  name: string;  // Нет декораторов!
}

// ✅ Хорошо
export class CreateDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### 2. Не конвертировали строку в число
```typescript
// ❌ Плохо - id остается строкой
@Get(':id')
async get(@Param('id') id: string) {
  return this.service.findOne(id);  // Ошибка: ожидается number
}

// ✅ Хорошо
@Get(':id')
async get(@Param('id') id: string) {
  return this.service.findOne(Number(id));
}
```

### 3. Забыли as any для JSON полей Prisma
```typescript
// ❌ Плохо - TypeScript ошибка
ingredients: ingredients,

// ✅ Хорошо
ingredients: ingredients as any,
```

### 4. Не добавили @UseGuards для защищенных эндпоинтов
```typescript
// ❌ Плохо - любой может удалить
@Delete(':id')
async delete(@Param('id') id: string) { ... }

// ✅ Хорошо
@Delete(':id')
@UseGuards(JwtAuthGuard)
async delete(@Param('id') id: string) { ... }
```

---

## 📚 Полезные ссылки

- [NestJS Documentation](https://docs.nestjs.com)
- [Class Validator Decorators](https://github.com/typestack/class-validator#validation-decorators)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Swagger/OpenAPI in NestJS](https://docs.nestjs.com/openapi/introduction)

---

## 🎓 Пример: Полный flow создания эндпоинта

### Задача: Создать эндпоинт для добавления рецепта в избранное

#### 1. DTO (не нужен - только ID рецепта из URL)

#### 2. Service
```typescript
// recipe.service.ts
async addToFavorites(userId: number, recipeId: number): Promise<User> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const favorites = [...user.favoriteRecipeIds, recipeId];

  return this.prisma.user.update({
    where: { id: userId },
    data: {
      favoriteRecipeIds: favorites,
    },
  });
}
```

#### 3. Controller
```typescript
// recipe.controller.ts
@Post(':id/favorite')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Add recipe to favorites' })
@ApiParam({ name: 'id', description: 'Recipe ID' })
@ApiResponse({ status: 200, description: 'Recipe added to favorites' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 404, description: 'Recipe not found' })
async addToFavorites(
  @Param('id') recipeId: string,
  @CurrentUser() user: UserModel,
): Promise<User> {
  return this.recipeService.addToFavorites(
    user.id,
    Number(recipeId),
  );
}
```

#### 4. Тестирование
```bash
POST http://localhost:3000/recipes/123/favorite
Authorization: Bearer <token>
```

---

**Готово! Теперь у вас есть полный чек-лист для создания эндпоинтов в NestJS** 🚀