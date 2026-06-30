# ──────────────────────────────────────────────────────────────
# Diydor API (NestJS + Prisma) — multi-stage production image
# Build context: repo root (monorepo). Compose:
#   build: { context: ., dockerfile: apps/api/Dockerfile }
# ──────────────────────────────────────────────────────────────

# ---------- Build stage ----------
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
RUN npm install -g pnpm@9
WORKDIR /app

# Manifestlar avval — Docker layer cache uchun
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @diydor/api...

# Manba kod + Prisma client + build
COPY apps/api ./apps/api
RUN pnpm --filter @diydor/api exec prisma generate \
 && pnpm --filter @diydor/api run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
RUN npm install -g pnpm@9
WORKDIR /app
ENV NODE_ENV=production

# Bog'liqliklar (prisma CLI migratsiya uchun kerak — dev deps bilan o'rnatamiz.
# NODE_ENV=production bo'lgani uchun devDependencies (prisma) tushib qolmasligi
# uchun --prod=false majburiy.)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --prod=false --filter @diydor/api...

# Prisma schema + generatsiya
COPY apps/api/prisma ./apps/api/prisma
RUN pnpm --filter @diydor/api exec prisma generate

# Build natijasi + entrypoint
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

WORKDIR /app/apps/api
RUN mkdir -p uploads && chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
