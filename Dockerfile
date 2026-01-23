# Estágio Base
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Estágio de Dependências (Cache)
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Estágio de Build
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Estágio Final (Produção)
FROM base AS deploy
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/migrations ./src/migrations

EXPOSE 3000
CMD [ "pnpm", "start" ]