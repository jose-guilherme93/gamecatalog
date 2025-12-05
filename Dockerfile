
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ----------------------------------------------------------------------


FROM node:20-alpine AS production


WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules


COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/

COPY --from=builder /app/dist /app/dist

EXPOSE 3000

CMD [ "node", "dist/server.js" ]