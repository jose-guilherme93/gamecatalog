# Base image for Node.js applications
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
ENV HUSKY=0

# Stage for installing all dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .

# Stage for building the api-node application
FROM base AS build-api
WORKDIR /app
COPY --from=deps /app .
RUN pnpm --filter @gamecatalog/api build

# Stage for building the web application
FROM base AS build-web
WORKDIR /app
COPY --from=deps /app .
RUN pnpm --filter @gamecatalog/web build

# Stage for building the worker-donations application
FROM golang:1.25.6-alpine AS build-worker
WORKDIR /app
COPY --from=deps /app .
RUN cd apps/worker-donations && go build -o /app/dist/worker-donations main.go

# Final image for the api-node application
FROM base AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-api /app/apps/api-node/dist ./dist
COPY --from=build-api /app/apps/api-node/package.json ./package.json
RUN pnpm install --prod
EXPOSE 3000
CMD [ "node", "dist/server.js" ]

# Final image for the web application
FROM base AS web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-web /app/apps/web/.next ./.next
COPY --from=build-web /app/apps/web/public ./public
COPY --from=build-web /app/apps/web/package.json ./package.json
COPY --from=build-web /app/apps/web/next.config.js ./next.config.js
RUN pnpm install --prod
EXPOSE 3002
CMD [ "pnpm", "start" ]

# Final image for the worker-donations application
FROM alpine:latest AS worker
WORKDIR /app
COPY --from=build-worker /app/dist/worker-donations .
CMD [ "./worker-donations" ]