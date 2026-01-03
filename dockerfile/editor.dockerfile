# syntax=docker/dockerfile:1.6

FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY templates ./templates
COPY examples ./examples
COPY docs ./docs

RUN bun run build:webui

FROM oven/bun:1 AS runtime
WORKDIR /app

COPY package.json bun.lockb tsconfig.json ./
RUN bun install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/examples ./examples

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "src/backend/server.tsx"]

