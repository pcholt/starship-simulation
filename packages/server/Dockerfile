FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/engine/package.json packages/engine/package.json
COPY packages/server/package.json packages/server/package.json
RUN npm ci
COPY packages/engine packages/engine
COPY packages/server packages/server

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/engine ./packages/engine
COPY --from=build /app/packages/server ./packages/server
EXPOSE 8080
CMD ["node", "--import", "tsx", "packages/server/src/index.ts"]
