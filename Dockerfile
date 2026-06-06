# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN yarn install --frozen-lockfile \
  && yarn prisma generate

COPY . .

RUN yarn build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 py3-pip ffmpeg \
  && pip3 install --no-cache-dir yt-dlp --break-system-packages

COPY package.json yarn.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN yarn install --production --frozen-lockfile \
  && yarn prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/src/main"]
