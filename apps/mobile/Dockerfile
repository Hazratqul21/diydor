# ──────────────────────────────────────────────────────────────
# Diydor Mobile (TMA) - frontend
# Build context: repo root
# ──────────────────────────────────────────────────────────────

# ---------- Build stage ----------
FROM node:20-alpine AS build
RUN npm install -g pnpm@9
WORKDIR /app

# Manifestlarni ko'chirish
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/mobile/package.json ./apps/mobile/package.json

# Bog'liqliklarni o'rnatish
RUN pnpm install --frozen-lockfile --filter @diydor/mobile...

# Kodni ko'chirish va build qilish
COPY apps/mobile ./apps/mobile
RUN pnpm --filter @diydor/mobile run build

# ---------- Runtime stage ----------
FROM nginx:alpine AS runner

# Nginx konfiguratsiyasini ko'chirish
COPY apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf

# Build qilingan fayllarni ko'chirish
COPY --from=build /app/apps/mobile/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
