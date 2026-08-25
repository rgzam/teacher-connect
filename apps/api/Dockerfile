FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY prisma ./prisma
COPY packages/types ./packages/types
COPY apps/api ./apps/api
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN pnpm exec prisma generate && pnpm --filter api build

FROM base AS runner
ENV NODE_ENV=production
ENV API_PORT=3001
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY prisma ./prisma
COPY apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown -R node:node /app
USER node
EXPOSE 3001
ENTRYPOINT ["/app/docker-entrypoint.sh"]
