# --- build stage: install workspace, compile, flatten server output ---
FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm build \
 && pnpm --filter @claude-usage/server deploy --prod --legacy /out

# --- runtime stage: nothing but Node + the deployed server ---
FROM node:22-alpine
WORKDIR /app
COPY --from=build /out/dist ./dist
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
USER node
EXPOSE 8787
CMD ["node", "dist/index.js"]
