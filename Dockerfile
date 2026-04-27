# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Генерируем Prisma Client (делаем это ДО копирования остальных файлов)
RUN yarn prisma generate

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN yarn build

# Продакшн этап
FROM node:20-alpine

WORKDIR /app

# Копируем package.json и yarn.lock
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Устанавливаем только production зависимости
RUN yarn install --production --frozen-lockfile

# Генерируем Prisma Client в продакшн образе
RUN yarn prisma generate

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["sh", "-c", "yarn prisma migrate deploy && node dist/src/main"]