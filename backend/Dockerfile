# API NestJS + Prisma — Clave Seguridad CTA (ADR-01)
FROM node:22-bookworm-slim

# OpenSSL es necesario para el motor de migraciones de Prisma
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Dependencias (se cachean mientras package*.json no cambie)
COPY package*.json ./
RUN npm ci

# 2. Código, cliente de Prisma y compilación
COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate \
 && npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Las variables (DATABASE_URL, JWT_SECRET…) se pasan con --env-file al ejecutar
CMD ["node", "dist/main.js"]
