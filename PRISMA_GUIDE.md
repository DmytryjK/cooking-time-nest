# 📘 Prisma ORM - Полный гайд с примерами

## 🎯 Что такое Prisma?

**Prisma** - это ORM (Object-Relational Mapping), который позволяет работать с базой данных через TypeScript код вместо написания SQL запросов.

```
TypeScript код → Prisma → SQL → База данных
```

---

## 🏗️ Структура вашей схемы

```prisma
model User {
  id                Int      @id @default(autoincrement())
  email             String   @unique
  password          String
  name              String?
  recipes           Recipe[]
  favoriteRecipeIds Int[]    @default([])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Recipe {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  ingredients Json
  userId      Int?
  user        User?    @relation(fields: [userId], references: [id])
  images      RecipeImage[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RecipeImage {
  id        Int             @id @default(autoincrement())
  recipeId  Int
  recipe    Recipe          @relation(fields: [recipeId], references: [id])
  imageUrl  String
  publicId  String
  type      RecipeImageType
  createdAt DateTime        @default(now())
}
```

**Связи:**
- `User` имеет много `Recipe` (один пользователь → много рецептов)
- `Recipe` имеет много `RecipeImage` (один рецепт → много картинок)
- `Recipe` принадлежит `User` (один рецепт → один автор)

---

## 📖 CRUD операции

### 1️⃣ CREATE (Создание)

#### Простое создание
```typescript
// Создать рецепт без автора
const recipe = await prisma.recipe.create({
  data: {
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta',
    ingredients: [
      { name: 'Spaghetti', amount: 400, unit: 'g' }
    ],
  },
});
```

#### Создание со связью (connect - связать с существующим)
```typescript
// Создать рецепт и связать с пользователем
const recipe = await prisma.recipe.create({
  data: {
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta',
    ingredients: [...],
    user: {
      connect: { id: 1 },  // Связываем с пользователем id=1
    },
  },
});
```

#### Создание с вложенными объектами (create - создать новый)
```typescript
// Создать рецепт вместе с картинками
const recipe = await prisma.recipe.create({
  data: {
    title: 'Pizza Margherita',
    description: 'Italian classic',
    ingredients: [...],
    images: {
      create: [  // Создаем новые картинки
        {
          imageUrl: 'https://example.com/image1.jpg',
          publicId: 'img_123',
          type: 'MAIN',
        },
        {
          imageUrl: 'https://example.com/image2.jpg',
          publicId: 'img_124',
          type: 'PREVIEW',
        },
      ],
    },
  },
});
```

#### Создание множества записей
```typescript
// Создать несколько рецептов сразу
const recipes = await prisma.recipe.createMany({
  data: [
    { title: 'Recipe 1', ingredients: [...] },
    { title: 'Recipe 2', ingredients: [...] },
    { title: 'Recipe 3', ingredients: [...] },
  ],
});
// Вернет: { count: 3 }
```

---

### 2️⃣ READ (Чтение)

#### findUnique - Найти одну уникальную запись
```typescript
// По ID
const recipe = await prisma.recipe.findUnique({
  where: { id: 1 },
});
// Вернет: Recipe | null

// По уникальному полю (email)
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
});
```

#### findFirst - Найти первую подходящую запись
```typescript
// Найти первый рецепт пользователя
const recipe = await prisma.recipe.findFirst({
  where: { userId: 1 },
  orderBy: { createdAt: 'desc' },  // Самый новый
});
```

#### findMany - Найти много записей
```typescript
// Все рецепты
const recipes = await prisma.recipe.findMany();

// С фильтрацией
const recipes = await prisma.recipe.findMany({
  where: { userId: 1 },  // Рецепты пользователя
});

// С лимитом и offset (пагинация)
const recipes = await prisma.recipe.findMany({
  take: 10,   // Взять 10 записей
  skip: 20,   // Пропустить первые 20
});
```

#### count - Посчитать количество
```typescript
const count = await prisma.recipe.count({
  where: { userId: 1 },
});
// Вернет: number
```

---

### 3️⃣ UPDATE (Обновление)

#### update - Обновить одну запись
```typescript
const recipe = await prisma.recipe.update({
  where: { id: 1 },
  data: {
    title: 'New Title',
    description: 'New Description',
  },
});
```

#### updateMany - Обновить много записей
```typescript
// Обновить все рецепты пользователя
const result = await prisma.recipe.updateMany({
  where: { userId: 1 },
  data: { description: 'Updated by admin' },
});
// Вернет: { count: 5 }
```

#### upsert - Создать или обновить (если существует)
```typescript
const user = await prisma.user.upsert({
  where: { email: 'test@example.com' },
  update: {
    name: 'Updated Name',  // Если нашли - обновить
  },
  create: {
    email: 'test@example.com',
    password: 'hash',
    name: 'New User',  // Если не нашли - создать
  },
});
```

---

### 4️⃣ DELETE (Удаление)

#### delete - Удалить одну запись
```typescript
const recipe = await prisma.recipe.delete({
  where: { id: 1 },
});
```

#### deleteMany - Удалить много записей
```typescript
// Удалить все рецепты пользователя
const result = await prisma.recipe.deleteMany({
  where: { userId: 1 },
});
// Вернет: { count: 5 }

// Удалить ВСЕ рецепты (осторожно!)
const result = await prisma.recipe.deleteMany({});
```

---

## 🔍 Фильтрация (where)

### Простые условия

```typescript
// Точное совпадение
where: { id: 1 }
where: { title: 'Pizza' }

// NOT (не равно)
where: { NOT: { id: 1 } }

// IN (входит в список)
where: { id: { in: [1, 2, 3, 4, 5] } }

// NOT IN (не входит в список)
where: { id: { notIn: [1, 2, 3] } }
```

### Числовые сравнения

```typescript
// Больше / меньше
where: { id: { gt: 10 } }      // > 10
where: { id: { gte: 10 } }     // >= 10
where: { id: { lt: 100 } }     // < 100
where: { id: { lte: 100 } }    // <= 100

// Диапазон
where: {
  id: {
    gte: 10,
    lte: 100,
  },
}
```

### Строковые фильтры

```typescript
// contains - содержит (LIKE '%text%')
where: {
  title: {
    contains: 'pizza',
    mode: 'insensitive',  // Регистронезависимый поиск
  },
}

// startsWith - начинается с (LIKE 'text%')
where: {
  title: { startsWith: 'Italian' },
}

// endsWith - заканчивается на (LIKE '%text')
where: {
  title: { endsWith: 'salad' },
}

// equals - точное совпадение
where: {
  email: { equals: 'test@example.com' },
}
```

### NULL / NOT NULL

```typescript
// Поле NULL
where: { description: null }
where: { description: { equals: null } }

// Поле NOT NULL
where: { description: { not: null } }

// Опциональное поле заполнено
where: { userId: { not: null } }
```

### Логические операторы (AND, OR, NOT)

```typescript
// AND (все условия должны совпадать)
where: {
  AND: [
    { userId: 1 },
    { title: { contains: 'pasta' } },
  ],
}

// OR (хотя бы одно условие)
where: {
  OR: [
    { title: { contains: 'pizza' } },
    { description: { contains: 'pizza' } },
  ],
}

// Комбинация
where: {
  userId: 1,
  OR: [
    { title: { contains: 'pasta' } },
    { title: { contains: 'pizza' } },
  ],
}

// NOT (отрицание)
where: {
  NOT: {
    title: { contains: 'soup' },
  },
}
```

### Фильтрация по связанным таблицам

```typescript
// Рецепты пользователя с именем "John"
const recipes = await prisma.recipe.findMany({
  where: {
    user: {
      name: { contains: 'John' },
    },
  },
});

// Рецепты с картинками типа "MAIN"
const recipes = await prisma.recipe.findMany({
  where: {
    images: {
      some: {  // Хотя бы одна картинка
        type: 'MAIN',
      },
    },
  },
});

// Рецепты БЕЗ картинок
const recipes = await prisma.recipe.findMany({
  where: {
    images: {
      none: {},  // Нет картинок
    },
  },
});

// Рецепты где ВСЕ картинки типа "PREVIEW"
const recipes = await prisma.recipe.findMany({
  where: {
    images: {
      every: {
        type: 'PREVIEW',
      },
    },
  },
});
```

---

## 📊 Сортировка (orderBy)

```typescript
// По одному полю
orderBy: { createdAt: 'desc' }  // От новых к старым
orderBy: { title: 'asc' }       // По алфавиту

// По нескольким полям
orderBy: [
  { userId: 'asc' },      // Сначала по userId
  { createdAt: 'desc' },  // Потом по дате
]

// По связанному полю
orderBy: {
  user: {
    name: 'asc',  // Сортировка по имени автора
  },
}

// По количеству связанных записей
orderBy: {
  images: {
    _count: 'desc',  // По количеству картинок
  },
}
```

---

## 🎯 Выборка полей (select)

```typescript
// Выбрать только определенные поля
const recipe = await prisma.recipe.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    title: true,
    // description НЕ будет в результате
  },
});
// Вернет: { id: 1, title: 'Pizza' }

// Выбрать поля и связанные данные
const recipe = await prisma.recipe.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    title: true,
    user: {
      select: {
        name: true,
        email: true,
      },
    },
  },
});
// Вернет: { id: 1, title: 'Pizza', user: { name: 'John', email: '...' } }
```

---

## 📦 Включение связанных данных (include)

```typescript
// Включить связанные данные
const recipe = await prisma.recipe.findUnique({
  where: { id: 1 },
  include: {
    user: true,     // Включить автора
    images: true,   // Включить картинки
  },
});
/* Вернет:
{
  id: 1,
  title: 'Pizza',
  description: '...',
  ingredients: [...],
  user: { id: 1, name: 'John', email: '...', ... },
  images: [
    { id: 1, imageUrl: '...', type: 'MAIN' },
    { id: 2, imageUrl: '...', type: 'PREVIEW' },
  ],
}
*/

// Вложенные include
const recipe = await prisma.recipe.findUnique({
  where: { id: 1 },
  include: {
    user: {
      include: {
        recipes: true,  // Все рецепты этого автора
      },
    },
  },
});

// Фильтрация связанных данных
const recipe = await prisma.recipe.findUnique({
  where: { id: 1 },
  include: {
    images: {
      where: { type: 'MAIN' },  // Только главные картинки
      take: 1,                   // Максимум 1
    },
  },
});
```

---

## 📄 Пагинация

### Offset-based (skip/take)
```typescript
const page = 2;
const pageSize = 10;

const recipes = await prisma.recipe.findMany({
  skip: (page - 1) * pageSize,  // Пропустить 10 записей
  take: pageSize,                // Взять 10 записей
  orderBy: { createdAt: 'desc' },
});

// Получить общее количество
const total = await prisma.recipe.count();

// Вернуть с мета-информацией
return {
  data: recipes,
  meta: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  },
};
```

### Cursor-based (более эффективная)
```typescript
const recipes = await prisma.recipe.findMany({
  take: 10,
  skip: 1,  // Пропустить курсор
  cursor: {
    id: lastRecipeId,  // Начать с этого ID
  },
  orderBy: { id: 'asc' },
});
```

---

## 🔗 Работа со связями

### Создание со связями

```typescript
// Связать с существующим пользователем
const recipe = await prisma.recipe.create({
  data: {
    title: 'Pizza',
    ingredients: [...],
    user: {
      connect: { id: 1 },  // Связать с пользователем #1
    },
  },
});

// Создать нового пользователя вместе с рецептом
const recipe = await prisma.recipe.create({
  data: {
    title: 'Pizza',
    ingredients: [...],
    user: {
      create: {  // Создать нового пользователя
        email: 'chef@example.com',
        password: 'hash',
        name: 'Chef John',
      },
    },
  },
});
```

### Обновление связей

```typescript
// Изменить автора рецепта
const recipe = await prisma.recipe.update({
  where: { id: 1 },
  data: {
    user: {
      connect: { id: 2 },  // Новый автор
    },
  },
});

// Отвязать от пользователя (сделать userId = null)
const recipe = await prisma.recipe.update({
  where: { id: 1 },
  data: {
    user: {
      disconnect: true,
    },
  },
});

// Добавить картинки к рецепту
const recipe = await prisma.recipe.update({
  where: { id: 1 },
  data: {
    images: {
      create: [
        { imageUrl: '...', publicId: '...', type: 'MAIN' },
      ],
    },
  },
});

// Удалить все картинки рецепта
const recipe = await prisma.recipe.update({
  where: { id: 1 },
  data: {
    images: {
      deleteMany: {},
    },
  },
});
```

---

## 🔎 Поиск - Практические примеры

### Пример 1: Поиск рецептов по названию или описанию
```typescript
async searchRecipes(searchQuery: string) {
  return prisma.recipe.findMany({
    where: {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      images: {
        where: { type: 'MAIN' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Использование:
const results = await searchRecipes('pasta');
```

### Пример 2: Фильтр рецептов по ингредиентам
```typescript
// Поиск в JSON поле (требует PostgreSQL)
async findByIngredient(ingredientName: string) {
  return prisma.recipe.findMany({
    where: {
      ingredients: {
        // path: ['$'], // JSON path
        // array_contains: ingredientName, // Не работает напрямую
      },
    },
  });
}

// Альтернатива: получить все и фильтровать в коде
async findByIngredient(ingredientName: string) {
  const allRecipes = await prisma.recipe.findMany();

  return allRecipes.filter(recipe => {
    const ingredients = recipe.ingredients as any[];
    return ingredients.some(ing =>
      ing.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
  });
}
```

### Пример 3: Получить популярные рецепты
```typescript
async getPopularRecipes(limit = 10) {
  // Рецепты, добавленные в избранное чаще всего
  const users = await prisma.user.findMany({
    select: {
      favoriteRecipeIds: true,
    },
  });

  // Подсчитать частоту
  const favoriteCount = new Map<number, number>();
  users.forEach(user => {
    user.favoriteRecipeIds.forEach(id => {
      favoriteCount.set(id, (favoriteCount.get(id) || 0) + 1);
    });
  });

  // Топ IDs
  const topIds = Array.from(favoriteCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  // Получить рецепты
  return prisma.recipe.findMany({
    where: {
      id: { in: topIds },
    },
    include: {
      user: true,
      images: true,
    },
  });
}
```

### Пример 4: Получить рецепты пользователя с пагинацией
```typescript
async getUserRecipes(userId: number, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          where: { type: 'MAIN' },
          take: 1,
        },
      },
    }),
    prisma.recipe.count({ where: { userId } }),
  ]);

  return {
    data: recipes,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

## 🚀 Продвинутые фичи

### Транзакции
```typescript
// Выполнить несколько операций атомарно
const result = await prisma.$transaction([
  prisma.recipe.create({ data: {...} }),
  prisma.user.update({ where: { id: 1 }, data: {...} }),
]);

// Интерактивная транзакция
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: 1 } });

  if (!user) throw new Error('User not found');

  await tx.recipe.create({
    data: {
      title: 'New Recipe',
      userId: user.id,
      ingredients: [...],
    },
  });
});
```

### Агрегации
```typescript
// Подсчет, сумма, среднее, мин, макс
const stats = await prisma.recipe.aggregate({
  _count: { id: true },
  _max: { createdAt: true },
  _min: { createdAt: true },
});

// Группировка
const userRecipeCounts = await prisma.recipe.groupBy({
  by: ['userId'],
  _count: { id: true },
  orderBy: {
    _count: { id: 'desc' },
  },
});
// Вернет: [{ userId: 1, _count: { id: 10 } }, ...]
```

### Raw запросы (если нужен чистый SQL)
```typescript
// Выполнить сырой SQL запрос
const recipes = await prisma.$queryRaw`
  SELECT * FROM "Recipe"
  WHERE title ILIKE ${'%pasta%'}
  LIMIT 10
`;

// Выполнить команду без возврата данных
await prisma.$executeRaw`
  UPDATE "Recipe" SET description = 'Updated' WHERE id = ${1}
`;
```

---

## 🛠️ Полезные методы

```typescript
// Проверить существование
const exists = await prisma.recipe.findUnique({
  where: { id: 1 },
  select: { id: true },
});
// exists будет { id: 1 } или null

// Получить или создать
let user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
});

if (!user) {
  user = await prisma.user.create({
    data: { email: 'test@example.com', password: 'hash' },
  });
}

// Или через upsert:
const user = await prisma.user.upsert({
  where: { email: 'test@example.com' },
  update: {},
  create: { email: 'test@example.com', password: 'hash' },
});
```

---

## ⚠️ Частые ошибки

### 1. Забыли await
```typescript
// ❌ Плохо - вернет Promise, а не данные
const recipe = prisma.recipe.findUnique({ where: { id: 1 } });

// ✅ Хорошо
const recipe = await prisma.recipe.findUnique({ where: { id: 1 } });
```

### 2. Использование include и select вместе
```typescript
// ❌ Ошибка - нельзя использовать вместе
const recipe = await prisma.recipe.findUnique({
  where: { id: 1 },
  select: { title: true },
  include: { user: true },  // Ошибка!
});

// ✅ Хорошо - используйте select
const recipe = await prisma.recipe.findUnique({
  where: { id: 1 },
  select: {
    title: true,
    user: true,  // Включить все поля user
  },
});
```

### 3. Неправильная обработка NULL
```typescript
// ❌ Может упасть, если recipe = null
const recipe = await prisma.recipe.findUnique({ where: { id: 999 } });
console.log(recipe.title);  // Error: Cannot read property 'title' of null

// ✅ Хорошо - проверка на null
const recipe = await prisma.recipe.findUnique({ where: { id: 999 } });
if (!recipe) {
  throw new NotFoundException('Recipe not found');
}
console.log(recipe.title);
```

### 4. N+1 проблема
```typescript
// ❌ Плохо - много запросов
const recipes = await prisma.recipe.findMany();
for (const recipe of recipes) {
  recipe.user = await prisma.user.findUnique({ where: { id: recipe.userId } });
}

// ✅ Хорошо - один запрос с include
const recipes = await prisma.recipe.findMany({
  include: { user: true },
});
```

---

## 🏢 Популярные операции на крупных проектах

### 1️⃣ Soft Delete (Мягкое удаление)

Вместо физического удаления записи помечаем её как удалённую.

**Добавьте в схему:**
```prisma
model Recipe {
  id          Int       @id @default(autoincrement())
  title       String
  deletedAt   DateTime? // null = активная запись
  // ... остальные поля
}
```

**Использование:**
```typescript
// "Удалить" рецепт
async softDelete(id: number) {
  return prisma.recipe.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// Восстановить рецепт
async restore(id: number) {
  return prisma.recipe.update({
    where: { id },
    data: { deletedAt: null },
  });
}

// Получить только активные рецепты
async getActive() {
  return prisma.recipe.findMany({
    where: { deletedAt: null },
  });
}

// Получить только удалённые
async getDeleted() {
  return prisma.recipe.findMany({
    where: { deletedAt: { not: null } },
  });
}

// Окончательное удаление старых записей (cron job)
async permanentlyDeleteOld() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return prisma.recipe.deleteMany({
    where: {
      deletedAt: {
        lt: thirtyDaysAgo,
      },
    },
  });
}
```

---

### 2️⃣ Фильтрация по датам

```typescript
// Рецепты за последние 7 дней
async getRecentRecipes() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return prisma.recipe.findMany({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });
}

// Рецепты за текущий месяц
async getThisMonthRecipes() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.recipe.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
      },
    },
  });
}

// Рецепты между датами
async getRecipesBetween(startDate: Date, endDate: Date) {
  return prisma.recipe.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

// Рецепты созданные сегодня
async getTodayRecipes() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.recipe.findMany({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
}
```

---

### 3️⃣ Bulk операции (Массовые операции)

```typescript
// Массовое создание с пропуском дубликатов
async bulkCreateRecipes(recipes: CreateRecipeDto[]) {
  return prisma.recipe.createMany({
    data: recipes,
    skipDuplicates: true, // Пропустить если есть уникальный конфликт
  });
}

// Массовое обновление
async bulkUpdateStatus(recipeIds: number[], status: string) {
  return prisma.recipe.updateMany({
    where: {
      id: { in: recipeIds },
    },
    data: {
      status,
    },
  });
}

// Массовое удаление
async bulkDelete(recipeIds: number[]) {
  return prisma.recipe.deleteMany({
    where: {
      id: { in: recipeIds },
    },
  });
}

// Массовое создание с транзакцией (с валидацией)
async bulkCreateWithValidation(recipes: CreateRecipeDto[]) {
  const results = [];

  await prisma.$transaction(async (tx) => {
    for (const recipeData of recipes) {
      // Проверка перед созданием
      const exists = await tx.recipe.findFirst({
        where: { title: recipeData.title },
      });

      if (!exists) {
        const recipe = await tx.recipe.create({
          data: recipeData,
        });
        results.push(recipe);
      }
    }
  });

  return results;
}
```

---

### 4️⃣ Upsert массива (Создать или обновить)

```typescript
// Обновить существующие или создать новые
async upsertRecipes(recipes: { id?: number; title: string; description: string }[]) {
  const operations = recipes.map(recipe => {
    if (recipe.id) {
      // Если есть ID - обновить
      return prisma.recipe.update({
        where: { id: recipe.id },
        data: { title: recipe.title, description: recipe.description },
      });
    } else {
      // Если нет ID - создать
      return prisma.recipe.create({
        data: { title: recipe.title, description: recipe.description, ingredients: [] },
      });
    }
  });

  return prisma.$transaction(operations);
}

// Upsert по уникальному полю
async upsertByTitle(title: string, data: any) {
  return prisma.recipe.upsert({
    where: { title }, // Требует @unique на title в схеме
    update: data,
    create: { title, ...data },
  });
}
```

---

### 5️⃣ Получение уникальных значений

```typescript
// Получить уникальные теги (если есть поле tags)
async getUniqueTags() {
  const recipes = await prisma.recipe.findMany({
    select: { tags: true },
  });

  const allTags = recipes.flatMap(r => r.tags);
  return [...new Set(allTags)]; // Уникальные значения
}

// Получить список авторов (пользователей с рецептами)
async getAuthorsWithRecipes() {
  return prisma.user.findMany({
    where: {
      recipes: {
        some: {}, // Есть хотя бы один рецепт
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: { recipes: true }, // Количество рецептов
      },
    },
  });
}
```

---

### 6️⃣ Работа с JSON полями (PostgreSQL)

```typescript
// Поиск по JSON полю
async findByIngredientName(name: string) {
  // Используя Raw SQL (PostgreSQL jsonb)
  return prisma.$queryRaw`
    SELECT * FROM "Recipe"
    WHERE ingredients::jsonb @> ${JSON.stringify([{ name }])}::jsonb
  `;
}

// Обновление части JSON
async updateIngredientAmount(recipeId: number, ingredientName: string, newAmount: number) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) return null;

  const ingredients = recipe.ingredients as any[];
  const updated = ingredients.map(ing =>
    ing.name === ingredientName ? { ...ing, amount: newAmount } : ing
  );

  return prisma.recipe.update({
    where: { id: recipeId },
    data: { ingredients: updated },
  });
}
```

---

### 7️⃣ Каскадное удаление и обработка связей

```typescript
// Удалить рецепт со всеми связанными картинками
// (Уже настроено в схеме: onDelete: Cascade)
async deleteRecipeWithImages(id: number) {
  return prisma.recipe.delete({
    where: { id },
    // images удалятся автоматически благодаря Cascade
  });
}

// Удалить пользователя и все его рецепты
async deleteUserWithRecipes(userId: number) {
  return prisma.user.delete({
    where: { id: userId },
    // recipes и images удалятся автоматически
  });
}

// Удалить рецепт и отвязать от favourites у пользователей
async deleteRecipeAndCleanFavorites(recipeId: number) {
  await prisma.$transaction(async (tx) => {
    // Найти всех пользователей с этим рецептом в избранном
    const users = await tx.user.findMany({
      where: {
        favoriteRecipeIds: {
          has: recipeId,
        },
      },
    });

    // Удалить из избранного
    for (const user of users) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          favoriteRecipeIds: user.favoriteRecipeIds.filter(id => id !== recipeId),
        },
      });
    }

    // Удалить рецепт
    await tx.recipe.delete({
      where: { id: recipeId },
    });
  });
}
```

---

### 8️⃣ Аудит логи (Кто и когда изменил)

**Добавьте в схему:**
```prisma
model Recipe {
  id          Int       @id @default(autoincrement())
  title       String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   Int?
  updatedBy   Int?
  // ... остальные поля
}
```

**Использование:**
```typescript
// Создание с указанием автора
async createWithAudit(data: any, userId: number) {
  return prisma.recipe.create({
    data: {
      ...data,
      createdBy: userId,
      updatedBy: userId,
    },
  });
}

// Обновление с отслеживанием
async updateWithAudit(id: number, data: any, userId: number) {
  return prisma.recipe.update({
    where: { id },
    data: {
      ...data,
      updatedBy: userId,
    },
  });
}

// Получить историю изменений (если есть таблица AuditLog)
async getAuditLog(recipeId: number) {
  return prisma.auditLog.findMany({
    where: {
      entityType: 'Recipe',
      entityId: recipeId,
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });
}
```

---

### 9️⃣ Полнотекстовый поиск (PostgreSQL)

```typescript
// Настройка в схеме:
// @@index([title(ops: ILike)]) // для LIKE запросов

// Поиск с весами (title важнее description)
async fullTextSearch(query: string) {
  return prisma.$queryRaw`
    SELECT *,
      ts_rank(
        setweight(to_tsvector('english', title), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B'),
        plainto_tsquery('english', ${query})
      ) as rank
    FROM "Recipe"
    WHERE
      to_tsvector('english', title) @@ plainto_tsquery('english', ${query})
      OR to_tsvector('english', coalesce(description, '')) @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 20
  `;
}

// Простой поиск по нескольким полям
async simpleSearch(query: string) {
  const searchTerms = query.split(' ');

  return prisma.recipe.findMany({
    where: {
      AND: searchTerms.map(term => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      })),
    },
  });
}
```

---

### 🔟 Оптимистичные блокировки (версионирование)

**Добавьте в схему:**
```prisma
model Recipe {
  id       Int    @id @default(autoincrement())
  title    String
  version  Int    @default(1) // Версия записи
  // ... остальные поля
}
```

**Использование:**
```typescript
// Обновление с проверкой версии
async updateWithVersion(id: number, data: any, expectedVersion: number) {
  // Обновить только если версия совпадает
  const result = await prisma.recipe.updateMany({
    where: {
      id,
      version: expectedVersion,
    },
    data: {
      ...data,
      version: { increment: 1 }, // Увеличить версию
    },
  });

  if (result.count === 0) {
    throw new Error('Conflict: Recipe was modified by another user');
  }

  return prisma.recipe.findUnique({ where: { id } });
}
```

---

### 1️⃣1️⃣ Пакетная загрузка (DataLoader pattern)

```typescript
// Для избежания N+1 проблемы
async getRecipesWithAuthors(recipeIds: number[]) {
  // Вместо N запросов - один запрос
  const recipes = await prisma.recipe.findMany({
    where: {
      id: { in: recipeIds },
    },
    include: {
      user: true,
    },
  });

  // Вернуть в том же порядке
  const recipeMap = new Map(recipes.map(r => [r.id, r]));
  return recipeIds.map(id => recipeMap.get(id));
}
```

---

### 1️⃣2️⃣ Условное обновление (только измененные поля)

```typescript
// Обновить только переданные поля
async partialUpdate(id: number, updates: Partial<Recipe>) {
  // Удалить undefined значения
  const data = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );

  return prisma.recipe.update({
    where: { id },
    data,
  });
}
```

---

### 1️⃣3️⃣ Работа с большими данными (стриминг)

```typescript
// Обработка больших объемов данных порциями
async processAllRecipes(batchSize = 100) {
  let cursor: number | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const recipes = await prisma.recipe.findMany({
      take: batchSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
    });

    if (recipes.length === 0) {
      hasMore = false;
      break;
    }

    // Обработать порцию
    for (const recipe of recipes) {
      // Ваша логика обработки
      console.log(`Processing recipe ${recipe.id}`);
    }

    cursor = recipes[recipes.length - 1].id;
  }
}
```

---

### 1️⃣4️⃣ Сложная агрегация и статистика

```typescript
// Статистика по рецептам
async getRecipeStats() {
  const [
    totalRecipes,
    recipesWithImages,
    avgIngredientsCount,
    topAuthors,
  ] = await Promise.all([
    // Общее количество
    prisma.recipe.count(),

    // Рецепты с картинками
    prisma.recipe.count({
      where: {
        images: {
          some: {},
        },
      },
    }),

    // Среднее количество ингредиентов (через raw SQL)
    prisma.$queryRaw`
      SELECT AVG(jsonb_array_length(ingredients::jsonb)) as avg
      FROM "Recipe"
    `,

    // Топ авторов по количеству рецептов
    prisma.recipe.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: 10,
    }),
  ]);

  return {
    totalRecipes,
    recipesWithImages,
    avgIngredientsCount,
    topAuthors,
  };
}
```

---

### 1️⃣5️⃣ Дедупликация данных

```typescript
// Найти дубликаты по названию
async findDuplicateTitles() {
  const duplicates = await prisma.recipe.groupBy({
    by: ['title'],
    _count: { id: true },
    having: {
      id: {
        _count: {
          gt: 1, // Больше одного
        },
      },
    },
  });

  return duplicates;
}

// Удалить дубликаты (оставить самый старый)
async removeDuplicates() {
  const duplicates = await this.findDuplicateTitles();

  for (const dup of duplicates) {
    // Найти все записи с этим title
    const recipes = await prisma.recipe.findMany({
      where: { title: dup.title },
      orderBy: { createdAt: 'asc' },
    });

    // Оставить первый, удалить остальные
    const [keep, ...remove] = recipes;

    await prisma.recipe.deleteMany({
      where: {
        id: {
          in: remove.map(r => r.id),
        },
      },
    });
  }
}
```

---

## 📚 Полезные ссылки

- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Query Examples](https://www.prisma.io/docs/concepts/components/prisma-client/crud)
- [Filtering and Sorting](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)
- [Relation Queries](https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries)

---

## 🎓 Шпаргалка - Быстрый справочник

| Операция | Код |
|----------|-----|
| **Создать** | `prisma.recipe.create({ data: {...} })` |
| **Найти один** | `prisma.recipe.findUnique({ where: { id: 1 } })` |
| **Найти много** | `prisma.recipe.findMany({ where: {...} })` |
| **Обновить** | `prisma.recipe.update({ where: {id: 1}, data: {...} })` |
| **Удалить** | `prisma.recipe.delete({ where: { id: 1 } })` |
| **Посчитать** | `prisma.recipe.count({ where: {...} })` |
| **Поиск (содержит)** | `where: { title: { contains: 'pasta' } }` |
| **Регистронезависимый** | `where: { title: { contains: 'pasta', mode: 'insensitive' } }` |
| **ИЛИ** | `where: { OR: [{...}, {...}] }` |
| **И** | `where: { AND: [{...}, {...}] }` |
| **Сортировка** | `orderBy: { createdAt: 'desc' }` |
| **Пагинация** | `skip: 10, take: 10` |
| **Включить связи** | `include: { user: true }` |
| **Выбрать поля** | `select: { id: true, title: true }` |

---

**Готово! Теперь у вас есть полный справочник по Prisma** 🚀
