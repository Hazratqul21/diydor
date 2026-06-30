# ──────────────────────────────────────────────────────────────
# Diydor Admin (React + Vite) — build + nginx static serve
# Build context: repo root (monorepo).
# ──────────────────────────────────────────────────────────────

# ---------- Build stage ----------
FROM node:20-alpine AS build
RUN npm install -g pnpm@9
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/admin/package.json ./apps/admin/package.json
RUN pnpm install --frozen-lockfile --filter @diydor/admin...

COPY apps/admin ./apps/admin

# API bazaviy manzili (nginx orqali /api ga proxy qilinadi)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @diydor/admin run build

# ---------- Runtime stage (nginx) ----------
FROM nginx:1.27-alpine AS runner
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
