# ----------------------------
# Stage 1: Build
# ----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ----------------------------
# Stage 2: Production

# ----------------------------
FROM node:20-alpine AS production

WORKDIR /app

# 1. Copia os arquivos de dependências
COPY package.json pnpm-lock.yaml ./ 
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile --ignore-scripts

# 2. Copia o código compilado do stage anterior
COPY --from=builder /app/dist ./dist

COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh 

EXPOSE 3000


ENTRYPOINT ["./docker-entrypoint.sh"]


CMD ["node", "dist/server.js"]
