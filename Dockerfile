FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/engine/package.json packages/engine/package.json
COPY packages/web/package.json packages/web/package.json
RUN npm ci
COPY . .
RUN npm run build --workspace @starship/web

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/web/build ./build
COPY --from=build /app/packages/web/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "build"]
