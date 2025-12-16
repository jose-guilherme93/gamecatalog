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
# ... Stage 1: Build (sem alteração necessária aqui)

# ----------------------------
# Stage 2: Production
# ----------------------------
FROM node:20-alpine AS production

WORKDIR /app

# 1. Copia os arquivos de dependências
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

# 2. Copia o código compilado do stage anterior
COPY --from=builder /app/dist ./dist

# 3. COPIA O ENTRYPOINT DIRETAMENTE DO CONTEXTO (seu computador/github)
# Ele precisa estar na mesma pasta que o Dockerfile no seu repositório
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

# O ENTRYPOINT deve ser usado para rodar comandos antes do app iniciar (como migrations)
ENTRYPOINT ["./docker-entrypoint.sh"]

# O CMD é passado como argumento para o entrypoint
CMD ["node", "dist/server.js"]
